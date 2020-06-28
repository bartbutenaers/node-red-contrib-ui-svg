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
    const fs = require('fs');
    const path = require('path');
    const mime = require('mime');
    // Shared object between N instances of this node (caching for performance)
    var faMapping;
    
    // -------------------------------------------------------------------------------------------------
    // Determining the path to the files in the dependent panzoom module once.
    // See https://discourse.nodered.org/t/use-files-from-dependent-npm-module/17978/5?u=bartbutenaers
    // -------------------------------------------------------------------------------------------------
    var panzoomPath = require.resolve("@panzoom/panzoom");
    
    // For example suppose the require.resolved results in panzoomPath = /home/pi/.node-red/node_modules/@panzoom/panzoom/dist/panzoom.js
    // Then we need to load the minified version
    panzoomPath = panzoomPath.replace("panzoom.js", "panzoom.min.js");

    if (!fs.existsSync(panzoomPath)) {
        console.log("Javascript file " + panzoomPath + " does not exist");
        panzoomPath = null;
    }

    function HTML(config) {       
        // The configuration is a Javascript object, which needs to be converted to a JSON string
        var configAsJson = JSON.stringify(config);

        // Fill the map once
        if (!faMapping) {
            faMapping = svgUtils.getFaMapping();
        }
        
        var svgString = config.svgString;
        
        // When no SVG string has been specified, we will show a notification
        if (!svgString || svgString === "") {
            svgString = String.raw`<svg width="250" height="100" xmlns="http://www.w3.org/2000/svg"> 
                            <g>
                                <rect stroke="#000000" id="svg_2" height="50" width="200" y="2.73322" x="2.00563" stroke-width="5" fill="#ff0000"/>
                                <text font-weight="bold" stroke="#000000" xml:space="preserve" text-anchor="middle" font-family="Sans-serif" font-size="24" id="svg_1" y="35.85669" x="100" stroke-width="0" fill="#000000">SVG is empty</text>
                            </g>
                        </svg>`;
        }
        
        // When a text element contains the CSS classname of a FontAwesome icon, we will replace it by its unicode value.
        svgString = svgString.replace(/(<text.*>)(.*)(<\/text>)/g, function(match, $1, $2, $3, offset, input_string) {
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
        
        // When the SVG string contains links to local images, we will replace those by a data url containing the base64 encoded
        // string of that image.  Otherwise the Dashboard (i.e. the browser) would not have access to that image...
        svgString = svgString.replace(/(xlink:href="file:\/\/)([^"]*)(")/g, function(match, $1, $2, $3, offset, input_string) {
            if (!config.directory) {
                console.log("For svg node with id=" + config.id + " no image directory has been specified");  
                // Leave the local file path untouched, since we cannot load the specified image
                return $1 + $2 + $3; 
            }
            
            var fileName = $2;
            var url = path.format({
                root: '/ignored',
                dir: config.directory,
                base: fileName
            });

            if (!fs.existsSync(url)) {
                console.log("The specified local image file (" + url + ") does not exist");  
                // Leave the local file path untouched, since we cannot load the specified image
                return $1 + $2 + $3; 
            }
            
            try {
                var data = fs.readFileSync(url);
                
                var contentType = mime.lookup(url);
                    
                var buff = new Buffer(data);
                var base64data = buff.toString('base64');

                // Return data url of base64 encoded image string
                return 'xlink:href="data:' + contentType + ';base64,' + base64data + '"';
            } 
            catch (err) {
                console.log("Cannot read the specified local image file (" + url + ")");  
                // Leave the local file path untouched, since we cannot load the specified image
                return $1 + $2 + $3;
            }
        })
        
        // Seems that the SVG string sometimes contains "&quot;" instead of normal quotes.
        // Those need to be removed, otherwise AngularJs will throw a parse error
        //svgString = svgString.replace(/&quot;/g, "'");
      
        var html = String.raw`
<style>
    .nr-dashboard-theme .nr-dashboard-template div.ui-svg svg{
        color: var(--nr-dashboard-widgetColor);
        fill: currentColor;
    }
    .nr-dashboard-theme .nr-dashboard-template div.ui-svg path {
        fill: inherit;
    }
</style>
<div id='tooltip_` + config.id + `' display='none' style='position: absolute; display: none; background: cornsilk; border: 1px solid black; border-radius: 5px; padding: 2px;'></div>
<div class='ui-svg' id='svggraphics_` + config.id + `' ng-init='init(` + configAsJson + `)'>` + svgString + `</div>
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
    
    function getNestedProperty(obj, key) {
        // Get property array from key string
        var properties = key.split(".");

        // Iterate through properties, returning undefined if object is null or property doesn't exist
        for (var i = 0; i < properties.length; i++) {
            if (!obj || !obj.hasOwnProperty(properties[i])) {
                return;
            }
            obj = obj[properties[i]];
        }

        // Nested property found, so return the value
        return obj;
    }

    var ui = undefined;
    
    function SvgGraphicsNode(config) {
         try {
            var node = this;
            if(ui === undefined) {
                ui = RED.require("node-red-dashboard")(RED);
            }
            RED.nodes.createNode(this, config);
            node.outputField = config.outputField;
            node.bindings = config.bindings;
            // Store the directory property, so it is available in the endpoint below
            node.directory = config.directory;
            
            node.availableCommands = ["get_text", "update_text", "update_innerHTML", "update_style", "set_style", "update_attribute", "set_attribute",
                                      "trigger_animation", "add_event", "remove_event", "zoom_in", "zoom_out", "zoom_by_percentage", "zoom_to_level",
                                      "pan_to_point", "pan_to_direction", "fit", "center", "add_element", "remove_element", "remove_attribute"];

            if (checkConfig(node, config)) { 
                var html = HTML(config);
                var done = ui.addWidget({
                    node: node,
                    group: config.group,
                    order: config.order,
                    width: config.width,
                    height: config.height,
                    format: html,
                    templateScope: "local",
                    emitOnlyNewValues: false,
                    forwardInputMessages: false,
                    storeFrontEndInputAsState: false,
                    // Avoid contextmenu to appear automatically after deploy.
                    // (see https://github.com/node-red/node-red-dashboard/pull/558)
                    persistantFrontEndValue: false,
                    convertBack: function (value) {
                        return value;
                    },
                    beforeEmit: function(msg, value) {                    
                        // ******************************************************************************************
                        // Server side validation of input messages.
                        // ******************************************************************************************

                        // Would like to ignore invalid input messages, but that seems not to possible in UI nodes:
                        // See https://discourse.nodered.org/t/custom-ui-node-not-visible-in-dashboard-sidebar/9666
                        // We will workaround it by sending a 'null' payload to the dashboard.

                        if (!msg.payload) {
                            node.error("A msg.payload is required");
                            msg.payload = null;
                        }
                        else {
                            // TODO Does are not blocking in version 1.0.  Nu wel of toch naar ui sturen?
                            if(msg.topic == "databind") {                                                                                                                   
                                if (node.bindings.length === 0) {
                                    node.error("Useless to send msg.topic 'databinding' since no bindings have been specified in the config screen.");
                                    msg.payload = null;
                                }
                                else {
                                    var counter = 0;

                                    node.bindings.forEach(function (binding, index) {
                                        if (getNestedProperty(msg, binding.bindSource)) {
                                            counter++;
                                        }
                                    });

                                    if (counter === 0) {
                                        node.error("Useless to send msg.topic 'databinding' since none of the bindings fields are available in this message.");
                                        msg.payload = null;
                                    }
                                }
                            }
                            else {
                                if (msg.topic && (typeof payload == "string" || typeof payload == "number")) {
                                    var topicParts = msg.topic.split("|");

                                    if (topicParts[0] !== "update_text" || topicParts[0] !== "update_innerHTML") {
                                        node.error("Only msg.topic 'update_text' or 'update_innerHTML' is supported");
                                        msg.payload = null;
                                    }
                                }
                                else {                                                                                          
                                    if (msg.topic) {
                                        node.warn("The specified msg.topic is not supported");
                                    }
                                    
                                    if(Array.isArray(msg.payload)){
                                        for (var i = 0; i < msg.payload.length; i++) {
                                            var part = msg.payload[i];

                                            if(typeof part != "object" && !part.command) {
                                                node.error("The msg.payload array should contain objects which all have a 'command' property.");
                                                msg.payload = null;
                                                break;
                                            }
                                            if(!node.availableCommands.includes(part.command)) {
                                                node.error("The msg.payload array contains an object that has an unsupported command property '" + part.command + "'");
                                                msg.payload = null;
                                                break;  
                                            }
                                        }
                                    }
                                    else {
                                        if(typeof msg.payload != "object" && !msg.payload.command) {
                                            node.error("The msg.payload should contain an object which has a 'command' property.");
                                            msg.payload = null;
                                        }
                                        else if(!node.availableCommands.includes(msg.payload.command)) {
                                            node.error("The msg.payload contains an object that has an unsupported command property '" + msg.payload.command + "'");
                                            msg.payload = null;
                                        }
                                    }
                                }
                            }
                        }

                        return { msg: msg };
                    },
                    beforeSend: function (msg, orig) {
                        if (!orig || !orig.msg) {
                           return;//TODO: what to do if empty? Currently, halt flow by returning nothing
                        }
                        
                        // When an error message is being send from the client-side, just log the error
                        if (orig.msg.hasOwnProperty("error")) {
                            node.error(orig.msg.error);
                            
                            // Dirty hack to avoid that the error message is being send on the output of this node
                            orig["_fromInput"] = true; // Legacy code for older dashboard versions
                            orig["_dontSend"] = true; 
                            return;
                        }
                            
                        // Compose the output message    
                        let newMsg = {
                            topic: orig.msg.topic,
                            elementId: orig.msg.elementId,
                            selector: orig.msg.selector,
                            event: orig.msg.event,
                        };
                        
                        // In the editableList of the clickable shapes, the content of the node.outputField property has been specified.
                        // Apply that content to the node.outputField property in the output message
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
                        // Remark: all client-side functions should be added here!  
                        // If added above, it will be server-side functions which are not available at the client-side ...
                        
                        function logError(error) {
                            // Log the error on the client-side in the browser console log
                            console.log(error);
                            
                            // Send the error to the server-side to log it there, if requested
                            if ($scope.config.showBrowserErrors) {
                                $scope.send({error: error});
                            }
                        }
                     
                        function setTextContent(element, textContent) {
                            var children = [];
                            
                            // When the text contains a FontAwesome icon name, we need to replace it by its unicode value.
                            // This is required when the text content is dynamically changed by a control message.
                            if (typeof textContent == "string" && textContent.startsWith("fa-")) {
                                // Try to get the unicode from our faMapping cache
                                var uniCode = $scope.faMapping[textContent.trim()];
                                
                                if(uniCode) {
                                    textContent = uniCode;
                                }
                                else {
                                    // Get the unicode value (that corresponds to the cssClass fa-xxx) from the server-side via a synchronous call
                                    $.ajax({ 
                                        url: "ui_svg_graphics/famapping/" + textContent, 
                                        dataType: 'json', 
                                        async: false, 
                                        success: function(json){ 
                                            // Only replace the fa-xxx icon when the unicode value is available.
                                            if (json.uniCode) {
                                                // Cache the unicode mapping on the client-side
                                                $scope.faMapping[json.cssClass] = json.uniCode;             

                                                textContent = json.uniCode;
                                            }
                                        } 
                                    });
                                }
                            }

                            // By setting the text content (which is similar to innerHtml), all animation child elements will be removed.
                            // To solve that we will remove the child elements in advance, and add them again afterwards...
                            children.push(...element.children);
                            for (var i = children.length - 1; i > -1; i--) {
                                element.removeChild(children[i]);
                            }
                            
                            // Cannot use element.textContent because then the FontAwesome icons are not rendered
                            element.innerHTML = textContent;
                            
                            for (var j = 0; j < children.length; j++) {
                                element.appendChild(children[j]);
                            }                           
                        }
                        
                        function handleEvent(evt) {
                            var userData = this.getAttribute("data-event_" + evt.type);
                                        
                            if (!userData) {
                                logError("No user data available for this " + evt.type + " event");
                                return;
                            }
                            
                            userData = JSON.parse(userData);
                            
                            var msg = {
                                selector   : userData.selector,
                                payload    : userData.payload,
                                payloadType: userData.payloadType,
                                topic      : userData.topic
                            }
                            
                            // In version 1.x.x there was a bug (msg.elementId contained the selector instead of the elementId).
                            // This was fixed in version 2.0.0, but (since it was a breaking change) by default for old nodes
                            // we still will send the selector instead of the elementId (to avoid breaking existing flows).
                            if ($scope.config.selectorAsElementId === undefined || $scope.config.selectorAsElementId === true) {
                                msg.elementId = userData.selector;
                            }
                            else {
                                msg.elementId = userData.elementId;
                            }
                            
                            // Get the mouse coordinates (with origin at left top of the SVG drawing)
                            if(evt.pageX !== undefined && evt.pageY !== undefined){
                                var pt = $scope.svg.createSVGPoint();
                                pt.x = evt.pageX;
                                pt.y = evt.pageY;
                                pt = pt.matrixTransform($scope.svg.getScreenCTM().inverse());
                                
                                msg.event = {
                                    type    : evt.type,
                                    svgX    : pt.x,
                                    svgY    : pt.y,
                                    pageX   : evt.pageX,
                                    pageY   : evt.pageY,
                                    screenX : evt.screenX,
                                    screenY : evt.screenY,
                                    clientX : evt.clientX,
                                    clientY : evt.clientY
                                }
                                
                                // Get the SVG element where the event has occured (e.g. which has been clicked)
                                var svgElement = $(event.target)[0];
                                
                                if (!svgElement) {
                                    logError("No SVG element has been found for this " + evt.type + " event");
                                    return;
                                }
                                
                                var bbox;
                                
                                try {
                                    // Use getBoundingClientRect instead of getBBox to have an array like [left, bottom, right, top].
                                    // See https://discourse.nodered.org/t/contextmenu-location/22780/64?u=bartbutenaers
                                    bbox = svgElement.getBoundingClientRect();
                                }
                                catch (err) {
                                    logError("No bounding client rect has been found for this " + evt.type + " event");
                                    return;  
                                }
                                
                                msg.event.bbox = [
                                    bbox.left,
                                    bbox.bottom,
                                    bbox.right,
                                    bbox.top
                                ]
                            }
                            
                            $scope.send(msg);
                        }
                        
                        function applyEventHandlers(rootElement) {
                            $scope.config.clickableShapes.forEach(function(clickableShape) {
                                // CAUTION: The "targetId" now contains the CSS selector (instead of the element id).  
                                //          But we cannot rename it anymore in the stored json, since we don't want to have impact on existing flows!!!
                                //          This is only the case for clickable shapes, not for animations (since there is no CSS selector possible)...
                                if (!clickableShape.targetId) {
                                    return;
                                }
                                var elements = rootElement.querySelectorAll(clickableShape.targetId); // The "targetId" now contains the CSS selector!
                                
                                if (elements.length === 0) {
                                    logError("No clickable elements found for selector '" + clickableShape.targetId + "'");
                                }
                                
                                var action = clickableShape.action || "click" ;
                                elements.forEach(function(element){
                                    // Set a hand-like mouse cursor, to indicate visually that the shape is clickable.
                                    // Don't set the cursor when a cursor with lines is displayed, because then we need to keep
                                    // the crosshair cursor (otherwise the pointer is on top of the tooltip, making it hard to read).
                                    //if (!config.showMouseLines) {
                                        //element.style.cursor = "pointer";
                                    //}
                                    
                                    //if the cursor is NOT set and the action is click, set cursor
                                    if(/*!config.showMouseLines && */ action == "click" /*&& !element.style.cursor*/) {
                                        element.style.cursor = "pointer";
                                    }
                                    
                                    // Store all the user data in a "data-<event>" element attribute, to have it available in the handleEvent function
                                    element.setAttribute("data-event_" + action,  JSON.stringify({
                                        elementId  : element.id,
                                        selector   : clickableShape.targetId, // The "targetId" now contains the CSS selector! 
                                        payload    : clickableShape.payload, 
                                        payloadType: clickableShape.payloadType, 
                                        topic      : clickableShape.topic
                                    }));
                                    
                                    // Make sure we don't end up with multiple handlers for the same event
                                    element.removeEventListener(action, handleEvent, false);
                                    
                                    element.addEventListener(action, handleEvent, false);
                                })
                            }); 
                        }
                        
                        $scope.flag = true;
                        $scope.init = function (config) {
                            $scope.config = config;
                            $scope.faMapping = {};
                            $scope.rootDiv = document.getElementById("svggraphics_" + config.id);
                            $scope.svg = $scope.rootDiv.querySelector("svg");
                            $scope.isObject = function(obj) {
                                return (obj != null && typeof obj === 'object' && (Array.isArray(obj) === false));    
                            }
                            $scope.events = ["click", "dblclick", "contextmenu", "mouseover", "mouseout", "mouseup", "mousedown", 
                                             "focus", "focusin", "focusout", "blur", "keyup", "keydown", "touchstart", "touchend"];
                            
                            //$scope.svg.style.cursor = "crosshair";

                            // Migrate old nodes which don't have pan/zoom functionality yet
                            var panning = config.panning || "disabled";
                            var zooming = config.zooming || "disabled";

                            if (panning !== "disabled" || zooming !== "disabled") {
                                var panZoomOptions = {
                                    disablePan        : panning === "disabled",
                                    disableXAxis      : panning === "y",
                                    disableYAxis      : panning === "x",
                                    disableZoom       : zooming === "disabled",
                                    panOnlyWhenZoomed : config.panOnlyWhenZoomed
                                }
                                
                                /*var isTouchDevice = 'ontouchstart' in document.documentElement;
                                if (!isTouchDevice) {
                                    console.log("No touch device functionality has been detected");
                                }*/
                                                           
                                // Apply the @panzoom/panzoom library to the svg element (see https://github.com/timmywil/panzoom).
                                $scope.panZoomModule = Panzoom($scope.svg, panZoomOptions);

                                // Panning and pinch zooming are bound automatically (unless disablePan is true).
                                // Other methods for zooming need to be added explicit, by using the provided functions.
                                if (config.mouseWheelZoomEnabled) {
                                    $scope.svg.parentElement.addEventListener('wheel', $scope.panZoomModule.zoomWithWheel);
                                }
                                
                                // Zoom in when double clicked, or zoom out when shift key down during double click
                                if (config.doubleClickZoomEnabled) {
                                    $scope.svg.parentElement.addEventListener('dblclick', function() {
                                        if (event.shiftKey) {
                                            $scope.panZoomModule.zoomOut();
                                        } else {
                                            $scope.panZoomModule.zoomIn();
                                        }
                                    });
                                }
                            }   

                            // Make the element clickable in the SVG (i.e. in the DIV subtree), by adding an onclick handler to ALL
                            // the SVG elements that match the specified CSS selectors.
                            applyEventHandlers($scope.rootDiv);                           
                            
                            // Apply the animations to the SVG elements (i.e. in the DIV subtree), by adding <animation> elements
                            config.smilAnimations.forEach(function(smilAnimation) {
                                if (!smilAnimation.targetId) {
                                    return;
                                }
                                
                                var element = $scope.rootDiv.querySelector("#" + smilAnimation.targetId);
                                
                                if (element) {
                                    var animationElement;

                                    // For attribute "transform" an animateTransform element should be created
                                    if (smilAnimation.attributeName === "transform") {
                                        animationElement = document.createElementNS("http://www.w3.org/2000/svg", 'animateTransform');
                                        animationElement.setAttribute("type"     , smilAnimation.transformType); 
                                    }
                                    else {
                                        animationElement = document.createElementNS("http://www.w3.org/2000/svg", 'animate');
                                    }
                                    
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
                                else {
                                    logError("No animatable element found for selector '" + smilAnimation.targetId + "'");
                                }
                            });                  

                            // Remark: it is not possible to show the coordinates when there is no svg element
                            if (config.showCoordinates && $scope.svg) {
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
                                                            setTextContent(element, bindValue);
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
                                                                setTextContent(element, bindValue);
                                                            } else if(typeof bindValue == "object"){
                                                                setTextContent(element, JSON.stringify(bindValue));
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
                                            //additional method of updating a text update_text|selector or  update_innerHTML|selector
                                            //e.g. @update_text|.graphtitle  or  update_text|#myText or  update_innerHTML|#myText
                                            var topicParts = msg.topic.split("|");
                                            if (topicParts.length > 1) {
                                                if (topicParts[0] == "update_text" || topicParts[0] == "update_innerHTML") {
                                                    selector = topicParts[1];
                                                    elements = $scope.rootDiv.querySelectorAll(selector);
                                                    if (!elements || !elements.length) {
                                                        logError("Invalid selector. No SVG elements found for selector " + selector);
                                                        return;
                                                    }
                                                    elements.forEach(function (element) {
                                                        setTextContent(element, payload);
                                                    });
                                                }
                                            } 
                                        }
                                        return;
                                    }
                                 
                                    //the payload.command or topic are both valid (backwards compatibility) 
                                    var op = payload.command || payload.topic

                                    switch (op) {
                                        case "add_element": // Add elements, or replace them if they already exist
                                            if (!payload.elementType) {
                                                logError("Invalid payload. A property named .elementType is not specified");
                                                return;
                                            }
                                            
                                            var parentElements = null;

                                            if (payload.parentSelector || payload.parentElementId) {
                                                selector = payload.parentSelector || "#" + payload.parentElementId;
                                                parentElements = $scope.rootDiv.querySelectorAll(selector);
                                            }
                                            
                                            if (!parentElements || !parentElements.length) {
                                                // When no parent elements have been specified, add the SVG element directly under the SVG element
                                                parentElements = [$scope.svg];
                                            }
                                            
                                            // It is not possible to add elements with the same id to multiple parent elements
                                            if (parentElements.length > 1 && payload.elementId) {
                                                logError("When multiple parent SVG elements are specified, it is not allowed to specify an .elementId");
                                                return;
                                            }
                                        
                                            // Create a new SVG element (of the specified type) to every specified parent SVG element
                                            parentElements.forEach(function(parentElement){
                                                var newElement = document.createElementNS("http://www.w3.org/2000/svg", payload.elementType);
                                                
                                                if (payload.elementId) {
                                                    newElement.setAttribute("id", payload.elementId);
                                                }
                                                
                                                if (payload.elementAttributes) {
                                                    for (const [key, value] of Object.entries(payload.elementAttributes)) {
                                                        newElement.setAttribute(key, value);
                                                    }
                                                }
                                                
                                                if (payload.elementStyleAttributes) {
                                                    var style = "";
                                                    // Convert the Javascript object to a style formatted string
                                                    for (const [key, value] of Object.entries(payload.elementStyleAttributes)) {
                                                        style += key;
                                                        style += ":";
                                                        style += value;
                                                        style += "; ";
                                                    }
                                                    newElement.setAttribute("style", style);
                                                }
                                                
                                                if (payload.textContent) {
                                                    setTextContent(newElement, payload.textContent);
                                                }
                                                
                                                // In the "Events" tabsheet might be a CSS selector that matches this new element. This means that the 
                                                // new element might need to get event handlers automatically.  To make sure we ONLY apply those handlers 
                                                // to this new element, we add the element to a dummy parent which only has one child (i.e. this new element).
                                                var dummyParent = document.createElement("div");
                                                dummyParent.appendChild(newElement);
                                                applyEventHandlers(dummyParent);
                                                
                                                parentElement.appendChild(newElement);
                                            })
                                            
                                            break;
                                        case "remove_element":
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified");
                                                return;
                                            }  

                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector);
                                                return;
                                            }

                                            elements.forEach(function(element){
                                                var parent = element.parentNode;
                                                parent.removeChild(element);
                                            })
                                            break;
                                        case "get_text":
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified");
                                                return;
                                            }  
                                    
                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector);
                                                return;
                                            }
                                            
                                            var elementArray = [];
                                            elements.forEach(function(element){
                                                elementArray.push({
                                                    id: element.id,
                                                    text: element.textContent
                                                });
                                            });  

                                            $scope.send({
                                                payload: elementArray
                                            });                                             
                                            break;
                                        case "update_text":
                                        case "update_innerHTML"://added to make adding inner HTML more readable/logical
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified");
                                                return;
                                            }  

                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector);
                                                return;
                                            }
                                            var innerContent = payload.text || payload.html || payload.textContent;
                                            elements.forEach(function(element){
                                                setTextContent(element, innerContent);
                                            });                                                
                                            break;
                                        case "update_style":
                                        case "set_style"://same as update_style
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified");
                                                return;
                                            }  
                                            
                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector);
                                                return;
                                            }
                                            if (payload.style && $scope.isObject(payload.style)) {
                                                elements.css(payload.style);
                                            } else if(payload.attributeName) {
                                                elements.css(payload.attributeName, payload.attributeValue);
                                            } else {
                                                logError("Cannot update style! style object not valid or attributeName/attributeValue strings not provided (selector '" + selector + "')");
                                                return;
                                            }
                                            break;
                                        case "update_attribute":
                                        case "set_attribute": //fall through 
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified");
                                                return;
                                            }  
                                            
                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector);
                                                return;
                                            }
                                            elements.forEach(function(element){
                                                if (op == "update_attribute") {
                                                    if(!element.hasAttribute(payload.attributeName)) {
                                                        logError("An SVG element selected by '" + selector + "' has no attribute with name '" + payload.attributeName +"'");
                                                        return
                                                    }
                                                }
                                                if(!payload.attributeValue){
                                                    element.removeAttribute(payload.attributeName);
                                                } else {
                                                    element.setAttribute(payload.attributeName, payload.attributeValue);
                                                }
                                            });
                                            elements.forEach(function(element){
                                                element.setAttribute(payload.attributeName, payload.attributeValue);
                                            });
                                            break;
                                        case "remove_attribute":
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified");
                                                return;
                                            }  
                                            
                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector);
                                                return;
                                            }
                                            elements.forEach(function(element){
                                                if(element.hasAttribute(payload.attributeName)) {
                                                    element.removeAttribute(payload.attributeName);
                                                }
                                            });
                                            break;
                                        case "trigger_animation":
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified");
                                                return;
                                            }  
                                            
                                            selector = payload.selector || ("#" + payload.elementId);
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector);
                                                return;
                                            }
                                            if (!payload.action) {
                                                logError("When triggering an animation, there should be a .action field");
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
                                                                logError(`Error calling ${payload.elementId}.${payload.action}()`);
                                                            }
                                                            break;
                                                    }
                                                }

                                            });
                                            break;    
                                        case "add_event":// add the specified event(s) to the specified element(s)
                                        case "remove_event":// remove the specified event(s) from the specified element(s)
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified");
                                                return;
                                            }  

                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);

                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector);
                                                return;
                                            }

                                            if (!payload.event) {
                                                logError("No msg.payload.event has been specified");
                                                return;
                                            }

                                            if (!$scope.events.includes(payload.event)) {
                                                logError("The msg.payload.event contains an unsupported event name");
                                                return;
                                            }

                                            elements.forEach(function(element) {
                                                // Get all the user data in a "data-<event>" element attribute
                                                var userData = element.getAttribute("data-event_" + payload.event);
                                            
                                                if (op === "add_event") {
                                                    if (userData) {
                                                        logError("The event " + payload.event + " already has been registered");
                                                    }
                                                    else {
                                                        // Seems the event has been registered yet for this element, so let's do that now ...
                                                        element.addEventListener(payload.event, handleEvent, false);
                                                        
                                                        // Store all the user data in a "data-event_<event>" element attribute, to have it available in the handleEvent function
                                                        element.setAttribute("data-event_" + payload.event, JSON.stringify({
                                                            elementId  : element.id,
                                                            selector   : selector, 
                                                            payload    : payload.payload, 
                                                            payloadType: payload.payloadType, 
                                                            topic      : payload.topic
                                                        }));
                                                        
                                                        element.style.cursor = "pointer";
                                                    }
                                                }
                                                else { // "remove_event"
                                                    if (!userData) {
                                                        logError("The event " + payload.event + " was not registered yet");
                                                    }
                                                    else {
                                                        element.removeEventListener(payload.event, handleEvent, false);
                                                        
                                                        // Remove all the user data in a "data-<event>" element attribute
                                                        element.removeAttribute("data-event_" + payload.event);
                                                        
                                                        element.style.cursor = "";
                                                    }
                                                }
                                            });                                               
                                            break;
                                        case "zoom_in":
                                            if (!$scope.panZoomModule) {
                                                logError("Cannot zoom via input message, when zooming is not enabled in the settings");
                                                return;
                                            }
                                        
                                            $scope.panZoomModule.zoomIn();
                                            break;
                                        case "zoom_out":
                                            if (!$scope.panZoomModule) {
                                                logError("Cannot zoom via input message, when zooming is not enabled in the settings");
                                                return;
                                            }

                                            $scope.panZoomModule.zoomOut();
                                            break;
                                        case "zoom_by_percentage":
                                            if (!$scope.panZoomModule) {
                                                logError("Cannot zoom via input message, when zooming is not enabled in the settings");
                                                return;
                                            }

                                            if (!payload.percentage) {
                                                logError("No msg.payload.percentage has been specified");
                                                return;
                                            }
                                            
                                            // Convert e.g. 130% to a factor 1.3
                                            var factor = payload.percentage / 100;
                                            
                                            // Optionally point coordinates can be specified in the input message
                                            if (payload.x && payload.y) {
                                                // When a point has been specified, zoom by the specified percentage at the specified point
                                                $scope.panZoomModule.zoomToPoint(factor, {clientX: payload.x, clientY: payload.y});
                                            }
                                            else {
                                                // No point has been specified, so zoom by the specified percentage
                                                $scope.panZoomModule.zoom(factor);
                                            }
                                            break;
                                        case "pan_to_point":    
                                            if (!$scope.panZoomModule) {
                                                logError("Cannot pan via input message, when panning is not enabled in the settings");
                                                return;
                                            }

                                            if (!payload.x || !payload.y) {
                                                logError("No point coordinates (msg.payload.x msg.payload.y) have been specified");
                                                return;
                                            }
    
                                            // Pan (absolute) to rendered point
                                            $scope.panZoomModule.pan(msg.payload.x, msg.payload.y);
                                            break;
                                        case "pan_to_direction": 
                                            if (!$scope.panZoomModule) {
                                                logError("Cannot pan via input message, when panning is not enabled in the settings");
                                                return;
                                            }

                                            if (!payload.x || !payload.y) {
                                                logError("No direction coordinates (msg.payload.x msg.payload.y) have been specified");
                                                return;
                                            }
    
                                            // Pan (relative) by x/y of rendered pixels into a direction
                                            $scope.panZoomModule.panBy(msg.payload.x, msg.payload.y, { relative: true });
                                            break;
                                        case "reset_panzoom":
                                            if (!$scope.panZoomModule) {
                                                logError("Cannot pan via input message, when panning is not enabled in the settings");
                                                return;
                                            }

                                            $scope.panZoomModule.reset();
                                            break;    
                                        default:
                                            if (msg.topic) {
                                                logError("Unsupported msg.topic '" + msg.topic + "'");
                                            }
                                            else {
                                                logError("Unsupported command '" + payload.command + "'");
                                            }
                                    }
                                    
                                } 
                                catch (error) {
                                    logError("Unexpected error when processing input message: " + error); 
                                }
                            }

                            var payload = msg.payload;
                            var topic = msg.topic;
           
                            if (!payload || payload === "") {
                                logError("Missing msg.payload");
                                return;
                            }
                            
                            if(topic == "databind" || ((typeof payload == "string" || typeof payload == "number") && topic)){
                                processCommand(payload, topic);
                            } else {
                                if(!Array.isArray(payload)){
                                    payload = [payload];
                                }
                                payload.forEach(function(val,idx){
                                    if(typeof val != "object" || !val.command) {
                                        logError("The msg.payload should contain an object (or an array of objects) which have a 'command' property.");
                                    }
                                    else {   
                                        processCommand(val);
				    }
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
   
    // Make some static resources from this node public available (to be used in the FLOW EDITOR).
    RED.httpAdmin.get('/ui_svg_graphics/*', function(req, res){ 
        if (req.params[0].startsWith("lib/")) {
            var options = {
                root: __dirname,
                dotfiles: 'deny'
            };
        
            // Send the requested js library file to the client
            res.sendFile(req.params[0], options);
        }
        else if(req.params[0].startsWith("image/")) {
            // The url format to load a local image file will be "image/<svg_node_id>/<filename>"
            var parts = req.params[0].split("/");
            
            var svgNodeId = parts[1];
            var svgNode = RED.nodes.getNode(svgNodeId);
            
            if (parts.length !== 3) {
                console.log("To request a local image, the url should look like image/<svg_node_id>/<filename>");
                return;
            }
            
            if (!svgNode) {
                console.log("Svg node with id=" + svgNodeId + " cannot be found");
                return;
            }
            
            if (!svgNode.directory || svgNode.directory === "") {
                console.log("For svg node with id=" + svgNodeId + " no image directory has been specified");
                return;
            }
            
            var fileName = parts[2];
            
            var url = path.format({
                root: '/ignored',
                dir: svgNode.directory,
                base: fileName
            });

            if (fs.existsSync(url)) {
                fs.readFile(url, function(err, data) {
                    if (err) {
                        res.writeHead(404);
                        return res.end("File not found.");
                    }
                    
                    var img = Buffer.from(data, 'base64');

                    res.setHeader("Content-Type", mime.getType(url));
                    res.setHeader("Content-Length", img.length);
                    res.writeHead(200);

                    res.end(img);
                });
            } 
            else {
                res.writeHead(403);
                return res.end("Forbidden.");
            }
        }
        else {
            console.log("Only paths starting with 'lib' or 'image' are supported");
            return;
        }
    });
    
    // By default the UI path in the settings.js file will be in comment:
    //     //ui: { path: "ui" },
    // But as soon as the user has specified a custom UI path there, we will need to use that path:
    //     ui: { path: "mypath" },
    var uiPath = ((RED.settings.ui || {}).path) || 'ui';
	
    // Create the complete server-side path
    uiPath = '/' + uiPath + '/ui_svg_graphics';

    // Replace a sequence of multiple slashes (e.g. // or ///) by a single one
    uiPath = uiPath.replace(/\/+/g, '/');
	
    // Make the unicode conversion available (to the DASHBOARD).
    RED.httpNode.get(uiPath + "/:cmd/:value", function(req, res){
        var result = {};
        
        switch (req.params.cmd) {
            case "famapping":
                result.cssClass = req.params.value.trim();
                
                result.uniCode = faMapping.get(result.cssClass);
                
                if (result.uniCode) {
                    result.uniCode = "&#x" + result.uniCode + ";";
                }
                
                // Return a json object (containing the unicode value) to the dashboard
                res.json(result);
                break;
            case "lib":
                // Send the requested file to the client (in this case it will be panzoom.js)
                res.sendFile(panzoomPath)
                break;
            default:
                console.log("Unknown command " + req.params.cmd);
                res.status(404).json('Unknown command');
        }
    });
}
