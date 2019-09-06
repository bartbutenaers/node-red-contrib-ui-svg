/**
 * Copyright 2019 Bart Butenaers, Stephen McLaughlin
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
    const svgUtils = require('./svg_utils');

    function HTML(config) {
        // The configuration is a Javascript object, which needs to be converted to a JSON string
        var configAsJson = JSON.stringify(config);

	    faMapping = svgUtils.getFaMapping();
        
        // When a text element contains the CSS classname of a FontAwesome icon, we will replace it by its unicode value.
        var svgString = config.svgString.replace(/(<text.*>)(.*)(<\/text>)/g, function(match, $1, $2, $3, offset, input_string) {
            var iconCssClass = $2.trim();
            
            if (!iconCssClass.startsWith("fa-")) {
                // Nothing to replace when not a FontAwesome icon, so return the original text
                return match;
            }
            
            var uniCode = faMapping.get(iconCssClass);
            
            if (!uniCode) {
                // Failed to get the unicode value of the specified icon, so return the original text
                console.log("FontAwesome icon " + iconCssClass + " is not supported by this node");
                return match;
            }
            
            // Replace the CSS class name ($2) by its unicode value
            return $1 + "&#x" + uniCode + ";" + $3;
        })
        
        var html = String.raw`
            <div id='tooltip_` + config.id + `' display='none' style='position: absolute; display: none; background: cornsilk; border: 1px solid black; border-radius: 5px; padding: 2px;'></div>
            <div id='svggraphics_` + config.id + `' ng-init='init(` + configAsJson + `)'>` + svgString + `</div>
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
    
    function setResult(msg, field, value) {
        field = field ? field : "payload";
        const keys = field.split('.');
        const lastKey = keys.pop();
        const lastObj = keys.reduce((obj, key) => obj[key] = obj[key] || {}, msg); 
        lastObj[lastKey] = value;
    };

    var ui = undefined;
    
    function SvgGraphicsNode(config) {
         try {
            var node = this;
            if(ui === undefined) {
                ui = RED.require("node-red-dashboard")(RED);
            }
            RED.nodes.createNode(this, config);
            node.outputField = config.outputField;
            
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
                        return { msg: msg };
                    },
                    beforeSend: function (msg, orig) {
                        if (!orig || !orig.msg) {
                           return;//TODO: what to do if empty? Currently, halt flow by returning nothing
                        }
                        let newMsg = {
                            topic: orig.msg.topic,
                            elementId: orig.msg.elementId,
                            selector: orig.msg.selector,
                            event: orig.msg.event,
                            coordinates: orig.msg.coordinates,
                            position: orig.msg.position,
                        };
                        RED.util.evaluateNodeProperty(orig.msg.payload,orig.msg.payloadType,node,orig.msg,(err,value) => {
                            if (err) {
                                return;//TODO: what to do on error? Currently, halt flow by returning nothing
                            } else {
                                setResult(newMsg, node.outputField, value); 
                            }
                        }); 
                        return newMsg;
                    },
                    initController: function($scope, events) {
                        $scope.flag = true;
                        console.log("initController")
                        $scope.init = function (config) {
                            $scope.config = config;
                            $scope.rootDiv = document.getElementById("svggraphics_" + config.id);
                            $scope.svg = $scope.rootDiv.querySelector("svg");
                            //$scope.svg.style.cursor = "crosshair";
                            
                            // Make the element clickable in the SVG (i.e. in the DIV subtree), by adding an onclick handler
                            config.clickableShapes.forEach(function(clickableShape) {
                                if (!clickableShape.targetId) {
                                    return;
                                }
                                var elements = $scope.rootDiv.querySelectorAll(clickableShape.targetId);
                                var action = clickableShape.action || "click" ;
                                elements.forEach(function(element){
                                    console.log("initController.init > config.clickableShapes.forEach > element ok, adding action ")
                                    // Set a hand-like mouse cursor, to indicate visually that the shape is clickable.
                                    // Don't set the cursor when a cursor with lines is displayed, because then we need to keep
                                    // the crosshair cursor (otherwise the pointer is on top of the tooltip, making it hard to read).
                                    //if (!config.showMouseLines) {
                                        //element.style.cursor = "pointer";
                                    //}
                                    
                                    //if the cursor is NOT set and the action is click, set cursor
                                    if(/*!config.showMouseLines && */ action == "click" && !element.style.cursor) {
                                        element.style.cursor = "pointer";
                                    }
                                    
                                    $(element).on(action, function(evt) {
                                        // Get the mouse coordinates (with origin at left top of the SVG drawing)
                                        console.log( `$(element).on('${action}', function(evt) {...` )
                                        var msg = {
                                            event: action,
                                            elementId: clickableShape.targetId,
                                            selector: clickableShape.selector,
                                            payload: clickableShape.payload, 
                                            payloadType: clickableShape.payloadType, 
                                            topic: clickableShape.topic
                                        }
                                        if(evt.pageX !== undefined && evt.pageY !== undefined){
                                            var pt = $scope.svg.createSVGPoint();
                                            pt.x = evt.pageX;
                                            pt.y = evt.pageY;
                                            pt = pt.matrixTransform($scope.svg.getScreenCTM().inverse());
                                            //relative position on svg
                                            msg.coordinates = {
                                                x: pt.x,
                                                y: pt.y
                                            }
                                            //absolute position on page - usefull for sending to popup menu
                                            msg.position = {
                                                x: evt.pageX,
                                                y: evt.pageY
                                            }
                                        }
                                        $scope.send(msg); 
                                    });
                                })
                            });                            
                            
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
                                    animationElement.setAttribute("class", smilAnimation.classValue); 
                                    animationElement.setAttribute("attributeName", smilAnimation.attributeName); 
                                    if(smilAnimation.fromValue != "")
                                        animationElement.setAttribute("from"     , smilAnimation.fromValue); //permit transition from current value if not specified
                                    animationElement.setAttribute("to"           , smilAnimation.toValue); 
                                    animationElement.setAttribute("dur"          , smilAnimation.duration + (smilAnimation.durationUnit || "s")); // Seconds e.g. "2s"
                                    
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
                                    
                                    switch (smilAnimation.trigger) {
                                        case 'time':
                                            // Set the number of seconds (e.g. 2s) after which the animation needs to be started
                                            animationElement.setAttribute("begin", smilAnimation.delay + (smilAnimation.delayUnit || "s"));                                   
                                            break;
                                        case 'cust':
                                            animationElement.setAttribute("begin", smilAnimation.custom);
                                            break;
                                        default:
                                            // A message will trigger the animation
                                            // See https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/begin
                                            animationElement.setAttribute("begin", "indefinite");
                                    }                                
                                    // By appending the animation as a child of the SVG element, that parent SVG element will be animated.
                                    // So there is no need to specify explicit the xlink:href attribute on the animation element.
                                    element.appendChild(animationElement);
                                }
                            });

                            // // Add data-bind attributes to selected elements
                            // config.bindings.forEach(function (binding) {
                            //     if (!binding.selector) {
                            //         return;
                            //     }
                            //     var elements = $scope.rootDiv.querySelectorAll(binding.selector);
                            //     var bindingType = binding.bindingType;
                            //     var attributeName = binding.attribute;
                            //     var bindSource = binding.bindSource;
                            //     elements.forEach(function (element) {
                            //         console.log("initController.init > config.bindings.forEach > element ok, adding binding ")

                            //         $(element).on(action, function (evt) {
                            //             // Get the mouse coordinates (with origin at left top of the SVG drawing)
                            //             console.log(`$(element).on('${action}', function(evt) {...`)
                            //             var msg = {
                            //                 event: action,
                            //                 selector: binding.selector,
                            //                 payload: binding.payload,
                            //                 payloadType: binding.payloadType,
                            //                 topic: binding.topic
                            //             }
                            //             if (evt.pageX !== undefined && evt.pageY !== undefined) {
                            //                 var pt = $scope.svg.createSVGPoint();
                            //                 pt.x = evt.pageX;
                            //                 pt.y = evt.pageY;
                            //                 pt = pt.matrixTransform($scope.svg.getScreenCTM().inverse());
                            //                 //relative position on svg
                            //                 msg.coordinates = {
                            //                     x: pt.x,
                            //                     y: pt.y
                            //                 }
                            //                 //absolute position on page - usefull for sending to popup menu
                            //                 msg.position = {
                            //                     x: evt.pageX,
                            //                     y: evt.pageY
                            //                 }
                            //             }
                            //             $scope.send(msg);
                            //         });
                            //     })
                            // });                            



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
                                    
                                    // Make sure the tooltip follows the mouse cursor (very near).
                                    // Fix https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/28
                                    // - Tooltip not always readable
                                    // - Tooltip doesn't stick to the mouse cursor on Firefox
                                    // - Tooltip should flip when reaching the right and bottom borders of the drawing
                                    
                                    $scope.tooltip.innerHTML = `<span style='color:#000000'>${pt.x},${pt.y}</span>`;
                                    
                                    // Strangely enough ClientX/ClientY result in a tooltip on the wrong location ...
                                    //var target = e.target || e.srcElement;
                                    var tooltipX = evt.layerX;
                                    var tooltipY = evt.layerY;

                                    // We need the visible height and width of the SVG element, to have the tooltip flip when getting
                                    // near the right and bottom border.  In case scrollbars are available around our SVG, the 
                                    // clientHeight should represent the visible part of the SVG.  However that is not the case, because
                                    // it seems to represent the entire SVG, instead of only the visible part.  
                                    // Workaround: Get the "md-card" element (generated by the Node-RED dashboard) which is wrapping our
                                    // SVG-node.  The height of that element is exactly the visible height of our SVG drawing.
                                    // See also https://stackoverflow.com/questions/13122790/how-to-get-svg-element-dimensions-in-firefox
                                    var mdCardElement = $scope.rootDiv.parentElement;            

                                    if (tooltipX > (mdCardElement.clientWidth - $scope.tooltip.clientWidth - 20)) {
                                        // When arriving near the right border of the drawing, flip the tooltip to the left side of the cursor
                                        tooltipX = tooltipX - $scope.tooltip.clientWidth - 20;
                                    }
                                    
                                    if (tooltipY > (mdCardElement.clientHeight - $scope.tooltip.clientHeight - 20)) {
                                        // When arriving near the bottom border of the drawing, flip the tooltip to the upper side of the cursor
                                        tooltipY = tooltipY - $scope.tooltip.clientHeight - 20;
                                    }

                                    $scope.tooltip.style.left = (tooltipX + 10) + 'px';
                                    $scope.tooltip.style.top  = (tooltipY + 10) + 'px';
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
                            function getValueByName(obj, path, def) {
                                path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
                                path = path.replace(/^\./, '');           // strip a leading dot
                                var a = path.split('.');
                                for (var i = 0, n = a.length; i < n; ++i) {
                                    var k = a[i];
                                    if (k in obj) {
                                        obj = obj[k];
                                    } else {
                                        return def;
                                    }
                                }
                                return obj;
                            }             
                            function processCommand(payload, topic){
                                var selector, elements, attrElements, textElements;
                                try {
                                    if(topic){       
                                        if(topic == "databind"){
                                            //Bind entries in "Input Bindings" TAB
                                            var bindings = $scope.config.bindings;
                                            bindings.forEach(function (binding) {
                                                if (!binding.selector) {
                                                    return;
                                                }
                                                var elements = $scope.rootDiv.querySelectorAll(binding.selector);
                                                var bindType = binding.bindType;
                                                var attributeName = binding.attribute;
                                                var bindSource = binding.bindSource;
                                                elements.forEach(function (element) {
                                                    var bindValue = getValueByName(msg,bindSource)
                                                    if(bindValue !== undefined){
                                                        if(typeof bindValue == "object"){
                                                            bindValue = JSON.stringify(bindValue);
                                                        } 
                                                        if(bindType == "text"){
                                                            element.textContent = bindValue;
                                                        } else if (bindType == "attr") {
                                                            element.setAttribute(attributeName, bindValue);
                                                        }
                                                    } 
                                                });
                                            });

                                            //Bind elements with custom attributes data-bind-text and data-bind-attributes/data-bind-values
                                            textElements = $scope.rootDiv.querySelectorAll("[data-bind-text]");
                                            if (!textElements || !textElements.length) {
                                                //console.log("No SVG elements found for selector data-bind-text");
                                            } else {
                                                textElements.forEach(function (element) {
                                                    var binder = element.getAttribute("data-bind-text");
                                                    if(binder){
                                                        var bindValue = getValueByName(msg,binder)
                                                        if(bindValue !== undefined){
                                                            if(typeof bindValue == "string" || typeof bindValue == "number"){
                                                                element.textContent = bindValue;
                                                            } else if(typeof bindValue == "object"){
                                                                element.textContent = JSON.stringify(bindValue);
                                                            }                         
                                                        }                           
                                                    }                                                
                                                });
                                            }
                                            
                                            attrElements = $scope.rootDiv.querySelectorAll("[data-bind-attributes]");
                                            if (!attrElements || !attrElements.length) {
                                                //console.log("No SVG elements found for selector data-bind-attribute");
                                            } else {
                                                attrElements.forEach(function (element) {
                                                    var attributesCSV = element.getAttribute("data-bind-attributes");
                                                    var attrBindToCSV = element.getAttribute("data-bind-values");
                                                    if(attributesCSV && attrBindToCSV){
                                                        var attrNames = attributesCSV.split(",");
                                                        var attrBindTos = attrBindToCSV.split(",");
                                                        if(attrNames.length != attrBindTos.length){
                                                            console.warn("data-bind-attributes count is different to data-bind-values count")
                                                            return;
                                                        }    
                                                        var index;
                                                        for (index = 0; index < attrBindTos.length; index++){
                                                            var attName = attrNames[index];
                                                            var attBindVal = attrBindTos[index];
                                                            var attrValue = getValueByName(msg,attBindVal);
                                                            if(attrValue !== undefined){                                                                
                                                                if(typeof attrValue == "string" || typeof attrValue == "number"){
                                                                    element.setAttribute(attName, attrValue);
                                                                } else if(typeof attrValue == "object"){
                                                                    element.setAttribute(attName, JSON.stringify(attrValue));
                                                                }                         
                                                            }  
                                                        }                                                    
                                                    }                                                
                                                });
                                            }
                                            
                                        } else {
                                            //additional method of updating a text update_text|selector
                                            //e.g. @update_text|.graphtitle  or  update_text|#myText
                                            var topicParts = msg.topic.split("|");
                                            if (topicParts.length > 1) {
                                                if (topicParts[0] == "update_text") {
                                                    selector = topicParts[1];
                                                    elements = $scope.rootDiv.querySelectorAll(selector);
                                                    if (!elements || !elements.length) {
                                                        console.log("Invalid selector. No SVG elements found for selector " + selector);
                                                        return;
                                                    }
                                                    elements.forEach(function (element) {
                                                        element.textContent = payload;
                                                    });
                                                }
                                            } 
                                        }
                                        return;
                                    }

                                    if (!payload.elementId && !payload.selector) {
                                        console.log("Invalid payload. A property named .elementId or .selector is not specified");
                                        return;
                                    }          
                                    
                                    //the payload.command or topic are both valid (backwards compatibility) 
                                    var op = payload.command || payload.topic
                                    switch (op) {
                                        case "update_text":
                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                console.log("Invalid selector. No SVG elements found for selector " + selector);
                                                return;
                                            }
                                            elements.forEach(function(element){
                                                element.textContent = payload.textContent;
                                            });                                                
                                            break;
                                        case "update_attribute":
                                        case "set_attribute": //fall through 
                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                console.log("Invalid selector. No SVG elements found for selector " + selector);
                                                return;
                                            }
                                            elements.forEach(function(element){
                                                if (op == "update_attribute") {
                                                    if(!element.hasAttribute(payload.attributeName)) {
                                                        console.log("SVG element with id = " + payload.elementId + " has no attribute with name = " + attributeName);
                                                        return
                                                    }
                                                }
                                                element.setAttribute(payload.attributeName, payload.attributeValue);
                                            });
                                            elements.forEach(function(element){
                                                element.setAttribute(payload.attributeName, payload.attributeValue);
                                            });
                                            break;
                                        case "trigger_animation":
                                                
                                            selector = payload.selector || ("#" + payload.elementId);
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                console.log("Invalid selector. No SVG elements found for selector " + selector);
                                                return;
                                            }
                                            if (!payload.action) {
                                                console.log("When triggering an animation, there should be a .action field");
                                                return;
                                            }
                                            let animations = ["set","animate","animatemotion","animatecolor","animatetransform"]
                                            elements.forEach(function(element){
                                                let ele = (element.tagName + "").trim().toLowerCase();
                                                if (animations.includes(ele)) {
                                                    
                                                    switch (payload.action) {
                                                        case "start":
                                                            element.beginElement();
                                                            break;
                                                        case "stop":
                                                            element.endElement();
                                                            break;
                                                        default:
                                                            try {
                                                                element[payload.action]();
                                                            } catch (error) {
                                                                throw new Error(`Error calling ${payload.elementId}.${payload.action}()`);
                                                            }
                                                            break;
                                                    }
                                                }

                                            });                                                
                                    }
                                    
                                } catch (error) {
                                    console.error(error);
                                }
                            }

                            var payload = msg.payload;
                            var topic = msg.topic;
                            if(topic == "databind" || ((typeof payload == "string" || typeof payload == "number") && topic)){
                                processCommand(payload, topic);
                            } else {
                                if(!Array.isArray(payload)){
                                    payload = [payload];
                                }
                                payload.forEach(function(val,idx){
                                    if(typeof val == "object" && val.command)
                                        processCommand(val);
                                });
                            }   
                                                        
                        }, true);
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
   
    // Make all the static resources from this node public available (i.e. third party JQuery plugin tableHeadFixer.js).
    RED.httpAdmin.get('/ui_svg_graphics/*', function(req, res){
        var options = {
            root: __dirname /*+ '/static/'*/,
            dotfiles: 'deny'
        };
       
        // Send the requested file to the client (in this case it will be tableHeadFixer.js)
        res.sendFile(req.params[0], options)
    });
}
