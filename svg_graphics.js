/**
 * Copyright 2019 Bart Butenaers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    var settings = RED.settings;
    
    // TODOs:
    // - Error 404 loading ACE SVG layout file
    // - SVG image should be able to load locally or pushed via file?
    // - Currently only allowed to edit SVG elements (not add or remove).  Is that ok?
    // - Working with layers : see svg-edit who uses groups/titles
    // - Integration with svg-edit
    // - Best way to add fontAwesome icons?
    // - Animations start automatically, which is not what we want
    // - Scrollbars appear when area too small
    // - Show mouse coordinates if requested
    // - Waar preserve aspect ratio zetten (op config screen of in de svg tag)
    // - Remove expand button because it doesn't work
    

    function HTML(config) {
        // The configuration is a Javascript object, which needs to be converted to a JSON string
        var configAsJson = JSON.stringify(config);
        
        var html = String.raw`
            <div id='tooltip_` + config.id + `' display='none' style='position: absolute; display: none; background: cornsilk; border: 1px solid black; border-radius: 5px; padding: 2px;'></div>
            <div id='svggraphics_` + config.id + `' ng-init='init(` + configAsJson + `)'>` + config.svgString + `</div>
        `;
                        
        return html;
    };

    function checkConfig(node, conf) {
        if (!conf || !conf.hasOwnProperty("group")) {
            node.error(RED._("heat-map.error.no-group")); // TODO
            return false;
        }
        
        return true;
    }
    
    var ui = undefined;
    
    function SvgGraphicsNode(config) {
         try {
            var node = this;
            if(ui === undefined) {
                ui = RED.require("node-red-dashboard")(RED);
            }
            RED.nodes.createNode(this, config);

            if (checkConfig(node, config)) { 
                var html = HTML(config);
                var done = ui.addWidget({
                    node: node,
                    group: config.group,
                    width: config.width,
                    height: config.height,
                    format: html,
                    templateScope: "local",
                    emitOnlyNewValues: false,
                    forwardInputMessages: false,
                    storeFrontEndInputAsState: false,
                    convertBack: function (value) {
                        return value;
                    },
                    beforeEmit: function(msg, value) {   
                        debugger;
                        return { msg: msg };
                    },
                    beforeSend: function (msg, orig) {
                        debugger;
                        if (orig) {
                            return orig.msg;
                        }
                    },
                    initController: function($scope, events) {
                        $scope.flag = true;
                
                        $scope.init = function (config) {
                            $scope.config = config;

                            $scope.rootDiv = document.getElementById("svggraphics_" + config.id);
                            $scope.svg = $scope.rootDiv.querySelector("svg");
                            
                            $scope.svg.style.cursor = "crosshair";
                            
                            // Make the element clickable in the SVG (i.e. in the DIV subtree), by adding an onclick handler
                            config.clickableShapes.forEach(function(clickableShape) {
                                if (!clickableShape.targetId) {
                                    return;
                                }
                                
                                var element = $scope.rootDiv.querySelector("#" + clickableShape.targetId);
                                
                                if (element) {
                                    // Set a hand-like mouse cursor, to indicate visually that the shape is clickable.
                                    // Don't set the cursor when a cursor with lines is displayed, because then we need to keep
                                    // the crosshair cursor (otherwise the pointer is on top of the tooltip, making it hard to read).
                                    //if (!config.showMouseLines) {
                                        element.style.cursor = "pointer";
                                    //}
                                    
                                    element.onclick = function() {
                                        // TODO send coordinates
                                        $scope.send({payload: clickableShape.targetId, topic: "clicked"}); 
                                    }
                                }
                            });
                            
                            debugger;
                            
                            // Apply the animations to the SVG elements (i.e. in the DIV subtree), by adding <animation> elements
                            config.smilAnimations.forEach(function(smilAnimation) {
                                if (!smilAnimation.targetId) {
                                    return;
                                }
                                
                                var element = $scope.rootDiv.querySelector("#" + smilAnimation.targetId);
                                
                                if (element) {
                                    var animationElement = document.createElementNS("http://www.w3.org/2000/svg", 'animate');
                                    animationElement.setAttribute("id"           , smilAnimation.id); 
                                    animationElement.setAttribute("attributeType", "XML");  // TODO what is this used for ???
                                    animationElement.setAttribute("attributeName", smilAnimation.attributeName); 
                                    animationElement.setAttribute("from"         , smilAnimation.fromValue); 
                                    animationElement.setAttribute("to"           , smilAnimation.toValue); 
                                    animationElement.setAttribute("dur"          , smilAnimation.duration + "s"); // Seconds e.g. "2s"
                                    
                                    if (smilAnimation.repeatCount === "0") {
                                        animationElement.setAttribute("repeatCount"  , "indefinite");
                                    }
                                    else {
                                        animationElement.setAttribute("repeatCount"  , smilAnimation.repeatCount);
                                    }
                                    
                                    if (smilAnimation.freeze) {
                                        animationElement.setAttribute("fill"     , "freeze");
                                    }
                                    else {
                                        animationElement.setAttribute("fill"     , "remove");
                                    }
                                    
                                    if (smilAnimation.trigger === "msg") {
                                        // A message will trigger the animation
                                        // See https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/begin
                                        animationElement.setAttribute("begin"    , "indefinite");
                                    }
                                    else {
                                        // Set the number of seconds (e.g. 2s) after which the animation needs to be started
                                        animationElement.setAttribute("begin"    , smilAnimation.trigger);
                                    }

                                    // By appending the animation as a child of the SVG element, that parent SVG element will be animated.
                                    // So there is no need to specify explicit the xlink:href attribute on the animation element.
                                    element.appendChild(animationElement);
                                }
                            });
                            
                            if (config.showCoordinates) {
                                $scope.tooltip = document.getElementById("tooltip_" + config.id);

                                $scope.svg.addEventListener("mousemove", function(evt) {
                                    // Make sure the tooltip becomes visible, when inside the SVG drawing
                                    $scope.tooltip.style.display = "block";

                                    // Get the mouse coordinates (with origin at left top of the SVG drawing)
                                    var pt = $scope.svg.createSVGPoint();
                                    pt.x = evt.pageX;
                                    pt.y = evt.pageY;
                                    pt = pt.matrixTransform($scope.svg.getScreenCTM().inverse());
                                    pt.x = Math.round(pt.x);
                                    pt.y = Math.round(pt.y);
                                    
                                    // Show the coordinates in the tooltip
                                    $scope.tooltip.innerHTML = `${pt.x},${pt.y}`;
                                    
                                    // Make sure the tooltip follows the mouse cursor (very near)
                                    // Strangely enough ClientX/ClientY result in a tooltip on the wrong location ...
                                    $scope.tooltip.style.left = (evt.offsetX + 10) + 'px';
                                    $scope.tooltip.style.top  = (evt.offsetY + 10) + 'px';
                                }, false);

                                $scope.svg.addEventListener("mouseout", function(evt) {
                                    // The tooltip should be invisible, when leaving the SVG drawing
                                    $scope.tooltip.style.display = "none";
                                }, false);
                            }
                            
                            /* TODO When drawing the lines, they (and also the tooltip) becomes invisible quite frequently.
                               Seems that the 'mouseout' event is triggered, even when we are INSIDE the svg ...
                               Perhaps it has to do with this:  https://stackoverflow.com/questions/24636602/mouseout-mouseleave-gets-fired-when-mouse-moves-inside-the-svg-path-element
                            
                            if (config.showMouseLines) {                                
                                if (!$scope.horizontalMouseLine) {
                                    // Create a horizontal mouse line only once
                                    $scope.horizontalMouseLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                    $scope.horizontalMouseLine.setAttribute('id', 'horizontalMouseLine');
                                    $scope.horizontalMouseLine.setAttribute('x1', -Number.MAX_SAFE_INTEGER);
                                    $scope.horizontalMouseLine.setAttribute('y1', '0');
                                    $scope.horizontalMouseLine.setAttribute('x2', Number.MAX_SAFE_INTEGER);
                                    $scope.horizontalMouseLine.setAttribute('y2', '0');
                                    $scope.horizontalMouseLine.setAttribute("stroke", "black");
                                    $scope.horizontalMouseLine.setAttribute("stroke-width", "2");
                                    $scope.horizontalMouseLine.setAttribute("display", "none");
                                    
                                    // Insert this line as last shape in the SVG, to make sure it is drawn on top of all other shapes
                                    $scope.svg.appendChild($scope.horizontalMouseLine); 
                                }
                                
                                if (!$scope.verticalMouseLine) {
                                    // Create a horizontal mouse line only once
                                    $scope.verticalMouseLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                                    $scope.verticalMouseLine.setAttribute('id', 'verticalMouseLine');
                                    $scope.verticalMouseLine.setAttribute('x1', '0');
                                    $scope.verticalMouseLine.setAttribute('y1', -Number.MAX_SAFE_INTEGER);
                                    $scope.verticalMouseLine.setAttribute('x2', '0');
                                    $scope.verticalMouseLine.setAttribute('y2', Number.MAX_SAFE_INTEGER);
                                    $scope.verticalMouseLine.setAttribute("stroke", "black");
                                    $scope.verticalMouseLine.setAttribute("stroke-width", "2");
                                    $scope.verticalMouseLine.setAttribute("display", "none");
                                    
                                    // Insert this line as last shape in the SVG, to make sure it is drawn on top of all other shapes
                                    $scope.svg.appendChild($scope.verticalMouseLine); 
                                }
                                
                                $scope.svg.addEventListener("mousemove", function(evt) {
                                    // Make both lines becomes visible, when inside the SVG drawing
                                    $scope.horizontalMouseLine.style.display = "block";
                                    $scope.verticalMouseLine.style.display = "block";
                                    
                                    // Get the mouse coordinates (with origin at left top of the SVG drawing)
                                    var pt = $scope.svg.createSVGPoint();
                                    pt.x = evt.pageX;
                                    pt.y = evt.pageY;
                                    pt = pt.matrixTransform($scope.svg.getScreenCTM().inverse());
                                    
                                    // Draw the horizontal mouse line through the current mouse location
                                    $scope.horizontalMouseLine.setAttribute('y1', pt.y);
                                    $scope.horizontalMouseLine.setAttribute('y2', pt.y);
                                    
                                    // Draw the vertical mouse line through the current mouse location
                                    $scope.verticalMouseLine.setAttribute('x1', pt.x);
                                    $scope.verticalMouseLine.setAttribute('x2', pt.x);
                                }, false);

                                $scope.svg.addEventListener("mouseout", function(evt) {
                                    // Both mouse lines should be invisible, when leaving the SVG drawing
                                    $scope.horizontalMouseLine.style.display = "none";
                                    $scope.verticalMouseLine.style.display = "none";
                                }, false);
                            }*/
                        }

                        $scope.$watch('msg', function(msg) {
                            // Ignore undefined messages.
                            if (!msg) {
                                return;
                            }
                            
                            debugger;
                            
                            // The SVG element attribute values can be changed via the input messages
                            // TODO msg check naar server verschuiven
                            if (msg.payload && typeof msg.payload === 'object') {
                                if (!msg.payload.elementId) {
                                    console.log("There is no msg.payload.elementId available");
                                    return;
                                }          
                                
                                var element = $scope.rootDiv.querySelector("#" + msg.payload.elementId);

                                if (!element) {
                                    console.log("There is no SVG element with id = " + msg.payload.elementId);
                                    return;
                                }
                                        
                                switch (msg.topic) {
                                    case "update_attribute":
                                        // TODO is this correct?  can an element not have an attribute as long as no non-default value has been set?
                                        if (!element.hasAttribute(msg.payload.attributeName)) {
                                            console.log("The SVG element (id = " + msg.payload.elementId + ") has no attribute with name = " + attributeName);
                                            return;                                    
                                        }
                                        
                                        element.setAttribute(msg.payload.attributeName, msg.payload.attributeValue);
                                        break;
                                    case "trigger_animation":
                                        if (element.tagName !== "animate") {
                                            console.log("SVG element with id = " + msg.payload.elementId + " is no 'animate' tag");
                                            return;
                                        }
                                        
                                        // TODO deze test naar de server verschuiven
                                        if (!msg.payload.status) {
                                            console.log("When triggering an animation, there should be a msg.payload.status field");
                                            return;
                                        }
                                        
                                        switch (msg.payload.status) {
                                            case "start":
                                                element.beginElement();
                                                break;
                                            case "stop":
                                                element.endElement();
                                                break;
                                            default:
                                                console.log("When triggering an animation, the msg.payload.status field should contain 'start' or 'stop'");
                                                break;
                                        }
                                }
                            }
                        });
                    }
                });
            }
        }
        catch (e) {
            console.log(e);
        }
		
        node.on("close", function() {
            if (done) {
                done();
            }
        });
    }

    RED.nodes.registerType("ui_svg_graphics", SvgGraphicsNode);
}
