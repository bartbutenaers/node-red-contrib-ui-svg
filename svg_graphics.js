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
    var settings    = RED.settings;
    const svgUtils  = require('./svg_utils');
    const fs        = require('fs');
    const path      = require('path');
    const mime      = require('mime');
    const postcss   = require('postcss');
    const prefixer  = require('postcss-prefix-selector');
    const svgParser = require('svgson')

    // Shared object between N instances of this node (caching for performance)
    var faMapping;
    
    // -------------------------------------------------------------------------------------------------
    // Determining the path to the files in the dependent js-beautify module once.
    // See https://discourse.nodered.org/t/use-files-from-dependent-npm-module/17978/5?u=bartbutenaers
    // -------------------------------------------------------------------------------------------------
    var jsBeautifyHtmlPath = require.resolve("js-beautify");
    
    // For example suppose the require.resolved results in jsBeautifyHtmlPath = /home/pi/.node-red/node_modules/js-beautify/js/index.js
    jsBeautifyHtmlPath = jsBeautifyHtmlPath.replace("index.js", "lib" + path.sep + "beautify-html.js");

    if (!fs.existsSync(jsBeautifyHtmlPath)) {
        console.log("Javascript file " + jsBeautifyHtmlPath + " does not exist");
        jsBeautifyHtmlPath = null;
    }

    // -------------------------------------------------------------------------------------------------
    // Determining the path to the files in the dependent js-beautify module once.
    // See https://discourse.nodered.org/t/use-files-from-dependent-npm-module/17978/5?u=bartbutenaers
    // -------------------------------------------------------------------------------------------------
    var jsBeautifyCssPath = require.resolve("js-beautify");
    
    // For example suppose the require.resolved results in jsBeautifyCssPath = /home/pi/.node-red/node_modules/js-beautify/js/index.js
    jsBeautifyCssPath = jsBeautifyCssPath.replace("index.js", "lib" + path.sep + "beautify-css.js");

    if (!fs.existsSync(jsBeautifyCssPath)) {
        console.log("Javascript file " + jsBeautifyCssPath + " does not exist");
        jsBeautifyCssPath = null;
    }
    
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
    
    // -------------------------------------------------------------------------------------------------
    // Determining the path to the files in the dependent hammerjs module once.
    // See https://discourse.nodered.org/t/use-files-from-dependent-npm-module/17978/5?u=bartbutenaers
    // -------------------------------------------------------------------------------------------------
    var hammerPath = require.resolve("hammerjs");
    
    // For example suppose the require.resolved results in panzoomPath = /home/pi/.node-red/node_modules/hammerjs/hammer.js
    // Then we need to load the minified version
    hammerPath = hammerPath.replace("hammer.js", "hammer.min.js");

    if (!fs.existsSync(hammerPath)) {
        console.log("Javascript file " + hammerPath + " does not exist");
        hammerPath = null;
    }

    function HTML(config) {
        // The old node id's in Node-RED contained a dot.  However that dot causes problems when using it inside scopedCssString.
        // Because the CSS will interpret the dot incorrectly, and will not apply the styles to the requested elements.
        // Therefore we will replace the dot by an underscore.
        config.nodeIdWithoutDot = config.id.replace(".", "_");
        
        // The configuration is a Javascript object, which needs to be converted to a JSON string
        var configAsJson = JSON.stringify(config, function (key,value) {
            switch (key) {
                case "svgString":
                    // Make sure the config.svgString value is not serialized in the JSON string because:
                    // - that field is already being passed as innerHtml for the SVG element.
                    // - that field would be passed unchanged to the client, while the same svgString would be changed for the innerHtml
                    //   (e.g. when the &quot; would still be available in the configAsJson, then the AngularJs client would still give parser errors).
                    // - for performance is it useless to send the same SVG string twice to the client, where it is never used via configAsJson
                    return undefined;
                case "sourceCode":
                    // Encode the javascript event handling source code as base64, otherwise AngularJs will not be able to parse it (due to unmatched quotes...)
                    return new Buffer(value).toString('base64'); 
            }
            
            return value;
        });

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
     
        // When the SVG string contains links to local server image files, we will replace those by a data url containing the base64 encoded
        // string of that image.  Otherwise the Dashboard (i.e. the browser) would not have access to that image...  We could have also added
        // an extra httpNode endpoint for the dashboard, which could provided images (similar to the admin endpoint which is available for the
        // flow editor.  This function is very similar to the function (in the html file) for resolving local images for DrawSvg...
        svgString = svgString.replace(/(xlink:href="[\\\/]{1})([^"]*)(")/g, function(match, $1, $2, $3, offset, input_string) {
            if (!config.directory) {
                console.log("For svg node with id=" + config.id + " no image directory has been specified");  
                // Leave the local file path untouched, since we cannot load the specified image
                return $1 + $2 + $3; 
            }
            
            // This is the local file URL, without the (back)slash in front
            var relativeFilePath = $2;                    
            var absoluteFilePath = path.join(config.directory, relativeFilePath);

            if (!fs.existsSync(absoluteFilePath)) {
                console.log("The specified local image file (" + absoluteFilePath + ") does not exist");  
                // Leave the local file path untouched, since we cannot load the specified image
                return $1 + $2 + $3; 
            }
            
            try {
                var data = fs.readFileSync(absoluteFilePath);
                
                var contentType = mime.getType(absoluteFilePath);
                    
                var buff = new Buffer(data);
                var base64data = buff.toString('base64');

                // Return data url of base64 encoded image string
                return 'xlink:href="data:' + contentType + ';base64,' + base64data + '"';
            } 
            catch (err) {
                console.log("Cannot read the specified local image file (" + absoluteFilePath + "): " + err);  
                // Leave the local file path untouched, since we cannot load the specified image
                return $1 + $2 + $3;
            }
        })
        
        // Seems that the SVG string sometimes contains "&quot;" instead of normal quotes.  For example:
        //    <text style="fill:firebrick; font-family: &quot;Arial Black&quot;; font-size: 50pt;"
        // Those need to be removed, otherwise AngularJs will throw a parse error.
        // Since those seem to occur between the double quotes of an attribute value, we will remove them (instead of replacing by single quotes) 
        svgString = svgString.replace(/&quot;/g, "");
        
        // Migrate old nodes which don't have pan/zoom functionality yet
        var panning = config.panning || "disabled";
        var zooming = config.zooming || "disabled";

        var panzoomScripts = "";
        if (panning !== "disabled" || zooming !== "disabled") {
            panzoomScripts = String.raw`<script src= "ui_svg_graphics/lib/panzoom"></script>
                                        <script src= "ui_svg_graphics/lib/hammer"></script>`
        }
        
        const DEFAULT_CSS_SVG_NODE = 
`div.ui-svg svg{
    color: var(--nr-dashboard-widgetColor);
    fill: currentColor !important;
}
div.ui-svg path {
    fill: inherit;
}`;

        // Apply a default CSS string to older nodes (version 2.2.4 and below)
        var cssString = config.cssString || DEFAULT_CSS_SVG_NODE;
        
        // Create a scoped CSS string, i.e. CSS styles that are only applied to the SVG in this node.
        // However scoped css has been removed from the specs (see https://github.com/whatwg/html/issues/552).
        // As a workaround we apply a prefix to every css selector, to make sure it is only applied to this SVG. 
        // A new outer div has been added with a unique class, to make prefixing easier.
        const scopedCssString = postcss().use(prefixer({
          prefix: ".svggraphics_" + config.nodeIdWithoutDot
        })).process(cssString).css;
      
        var html = String.raw
`<style>` + scopedCssString + `</style>` + panzoomScripts + 
`<div id='tooltip_` + config.nodeIdWithoutDot + `' display='none' style='z-index: 9999; position: absolute; display: none; background: cornsilk; border: 1px solid black; border-radius: 5px; padding: 2px;'>
</div>
<div class='svggraphics_` + config.nodeIdWithoutDot + `' style="width:100%; height:100%;">
   <div class='ui-svg' id='svggraphics_` + config.nodeIdWithoutDot + `' ng-init='init(` + configAsJson + `)' style="width:100%; height:100%;">` + svgString + `
   </div>
</div>`;              
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
                return undefined;
            }
            obj = obj[properties[i]];
        }

        // Nested property found, so return the value
        return obj;
    }

    var ui = undefined;

    function getAttributeBasedBindings(svgString) {
        var attributeBasedBindings = [];

        // Get all values of the custom attributes data-bind-text and data-bind-values.
        // Don't use matchAll, since that is only available starting from NodeJs version 12.0.0
        var regularExpression = /data-bind-[text|values]* *= *"(.*?)"/g;
        var match;
        while((match = regularExpression.exec(svgString)) !== null) {
            // The matched values will contain a "," separated list of msg field names, which need to be stored in an array of msg field names.
            attributeBasedBindings = attributeBasedBindings.concat(match[1].split(","));
        }
        
        // Trim the whitespaces from all the field names in the array
        for (var i = 0; i < attributeBasedBindings.length; i++) {
            attributeBasedBindings[i] = attributeBasedBindings[i].trim()
        }
        
        // Remove all duplicate msg field names from the array
        attributeBasedBindings = attributeBasedBindings.filter(function(item,index) {
            return attributeBasedBindings.indexOf(item) === index;
        });

        return attributeBasedBindings;
    }

    function SvgGraphicsNode(config) {
         try {
            var node = this;
            if(ui === undefined) {
                ui = RED.require("node-red-dashboard")(RED);
            }
            RED.nodes.createNode(this, config);
            node.outputField = config.outputField;
            node.bindings = config.bindings;
            // Get all the attribute based bindings in the svg string (that has been entered in the config screen)
            node.attributeBasedBindings = getAttributeBasedBindings(config.svgString);
            // Store the directory property, so it is available in the endpoint below
            node.directory = config.directory;

            node.availableCommands = ["get_text", "update_text", "update_innerhtml", "update_style", "set_style", "update_attribute", "set_attribute",
                                      "trigger_animation", "add_event", "remove_event", "add_js_event", "remove_js_event", "zoom_in", "zoom_out", "zoom_by_percentage",
                                      "zoom_to_level", "pan_to_point", "pan_to_direction", "reset_panzoom", "add_element", "remove_element", "remove_attribute",
                                      "get_svg", "replace_svg", "update_value", "replace_attribute", "replace_all_attribute"];

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
                        if ((msg.enabled === false || msg.enabled === true) && !msg.payload) {
                            // The Node-RED dashboard framework automatically disables/enables all user input when msg.enabled is supplied.
                            // We only need to make sure here the Debug panel is not filled with error messages about missing payloads.
                            // See https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/124
                            msg.payload = null;
                        }
                        else if (!msg.payload) {
                            node.error("A msg.payload is required (msg._msgid = '" + msg._msgid + "')");
                            msg.payload = null;
                        }
                        else {
                            var payload = msg.payload;
                            if(!Array.isArray(payload)){
                                payload = [payload];
                            }

                            // Check whether a new svg string is being injected.  Only take into account valid svg strings, because otherwise 
                            // the svg string will be ignored on the client side.  Which means we should also ignore it here on the server-side, 
                            // to avoid calculating attribute based bindings for an svg string that is not being used (causing inconsistencies...).
                            var svgReplacements = [];
                            for (var i = 0; i < payload.length; i++) {
                                if (payload[i].command === 'replace_svg' && payload[i].svg) {
                                    try {
                                        var svgNode = svgParser.parseSync(payload[i].svg);
                                        svgReplacements.push(payload[i].svg);
                                    } catch (error) {
                                        // Do nothing (i.e. the svg will not be appended to svgReplacements)
                                    }
                                }
                            }

                            if (svgReplacements.length > 0) {
                                // When a new svg string is injected (to replace the current svg), then all attribute based bindings
                                // should be determined again.  See issue https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/125
                                node.attributeBasedBindings = getAttributeBasedBindings(svgReplacements[0]);
                            }
                            
                            if(msg.topic == "databind") {
                                // The bindings can be specified both on the config screen and in the SVG source via custom user attributes.
                                // See https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/67
                                if (node.bindings.length === 0 && node.attributeBasedBindings.length === 0) {
                                    node.error("No bindings have been specified in the config screen or via data-bind-text or via data-bind-values (msg._msgid = '" + msg._msgid + "')");
                                    msg.payload = null;
                                }
                                else {
                                    var counter = 0;

                                    node.bindings.forEach(function (binding, index) {
                                        if (getNestedProperty(msg, binding.bindSource) !== undefined) {
                                            counter++;
                                        }
                                    });
                                    node.attributeBasedBindings.forEach(function (binding, index) {
                                        if (getNestedProperty(msg, binding) !== undefined) {
                                            counter++;
                                        }
                                    });

                                    if (counter === 0) {
                                        node.error("None of the specified bindings fields (in the config screen or data-bind-text or data-bind-values) are available in this message.");
                                        msg.payload = null;
                                    }
                                }
                            }
                            else if(msg.topic == "custom_msg") {
                                // no checks
                            }
                            else {
                                if (msg.topic && (typeof payload == "string" || typeof payload == "number")) {
                                    var topicParts = msg.topic.split("|");

                                    if (topicParts[0] !== "update_text" || topicParts[0] !== "update_innerHTML") {
                                        node.error("Only msg.topic 'update_text' or 'update_innerHTML' is supported (msg._msgid = '" + msg._msgid + "')");
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

                                            if(typeof part === "object" && !part.command) {
                                                node.error("The msg.payload array should contain objects which all have a 'command' property (msg._msgid = '" + msg._msgid + "')");

                                                msg.payload = null;
                                                break;
                                            }
                                            
                                            // Make sure the commands are not case sensitive anymore
                                            if(!node.availableCommands.includes(part.command.toLowerCase())) {
                                                node.error("The msg.payload array contains an object that has an unsupported command property '" + part.command + "' (msg._msgid = '" + msg._msgid + "')");
                                                msg.payload = null;
                                                break;  
                                            }
                                        }
                                    }
                                    else {
                                        if(typeof msg.payload === "object") {
                                            if(!msg.payload.command) {
                                                node.error("The msg.payload should contain an object which has a 'command' property (msg._msgid = '" + msg._msgid + "')");
                                                msg.payload = null;
                                            }
                                            // Make sure the commands are not case sensitive anymore
                                            else if(!node.availableCommands.includes(msg.payload.command.toLowerCase())) {
                                                node.error("The msg.payload contains an object that has an unsupported command property '" + msg.payload.command + "' (msg._msgid = '" + msg._msgid + "')");
                                                msg.payload = null;
                                            }
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
                        
                        // When an event message is being send from the client-side, just log the event
                        // Bug fix: use "browser_event" instead of "event" because normal message (like e.g. on click) also contain an "event".
                        // See https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/77
                        if (orig.msg.hasOwnProperty("browser_event")) {
                            node.warn(orig.msg.browser_event);
                            
                            // Dirty hack to avoid that the event message is being send on the output of this node
                            orig["_fromInput"] = true; // Legacy code for older dashboard versions
                            orig["_dontSend"] = true; 
                            return;
                        }
                            
                        // Compose the output message    
                        let newMsg = {};
                        
                        // Copy some fields from the original output message.
                        // Note that those fields are not always available, e.g. when a $scope.send(...) is being called from a javascript event handler.
                        if (orig.msg.topic) {
                            newMsg.topic = orig.msg.topic;
                        }
                        if (orig.msg.elementId) {
                            newMsg.elementId = orig.msg.elementId;
                        }                          
                        if (orig.msg.selector) {
                            newMsg.selector = orig.msg.selector;
                        }  
                        if (orig.msg.event) {
                            newMsg.event = orig.msg.event;
                        }

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
                        
                        function logEvent(eventDescription) {
                            // Log the eventDescription on the client-side in the browser console log
                            console.log(eventDescription);
                            
                            // Send the event to the server-side to log it there, if requested
                            if ($scope.config.showBrowserEvents) {
                                $scope.send({browser_event: eventDescription});
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
                        
                        function handleEvent(evt, proceedWithoutTimer) {
                            // Uncomment this section to troubleshoot events on mobile devices
                            //function stringifyEvent(e) {
                            //    const obj = {};
                            //    for (let k in e) {
                            //        obj[k] = e[k];
                            //    }
                            //    return JSON.stringify(obj, (k, v) => {
                            //        if (v instanceof Node) return 'Node';
                            //        if (v instanceof Window) return 'Window';
                            //        return v;
                            //    }, ' ');
                            //}
                            //logError("evt = " + stringifyEvent(evt));

                            // No need to do this twice: for proceedWithoutTimer=true the click event has already passed here before (with proceedWithoutTimer=null)
                            if (!proceedWithoutTimer) {
                                // PreventDefault to avoid the default browser context menu to popup, in case an event handler has been specfied in this node.
                                // See https://github.com/bartbutenaers/node-red-contrib-ui-svg/pull/93#issue-855852128
                                evt.preventDefault();
                                evt.stopPropagation();
                                
                                logEvent("Event " + evt.type + " has occured");
                            }
                            
                            // Get the SVG element where the event has occured (e.g. which has been clicked).
                            // Caution: You can add an event handler to a group, which is called when one of the (sub)elements of that group receives that event (e.g. 
                            // when that (sub)element is being clicked).  The event will bubble from the clicked (sub)element, up until the group element is reached.
                            // At that point we will arrive in this event handler:
                            // - evt.target will refer to the (sub)element that received the event
                            // - evt.currentTarget will refer to the group element to which the event handler is attached.
                            // Since our data-event_xxx attributes are available in the element that has the event handler, we will need to use evt.currentTarget !!
                            // See https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/97
                            var svgElement = $(evt.currentTarget)[0];
                            
                            if (!svgElement) {
                                logError("No SVG element has been found for this " + evt.type + " event");
                                return;
                            }

                            // When a shape has both a single-click and a double-click event handler.  Then a double click will result in in two single click events,
                            // followed by a double click event.  See https://discourse.nodered.org/t/node-red-contrib-ui-svg-click-and-dblclick-in-same-element/50203/6?u=bartbutenaers
                            // To prevent the single-clicks from occuring in this case, we start a timer of 400 msec.  If more than 1 click event occurs during
                            // that interval, it is considered as a double click (so the single clicks are ignored).
                            if (evt.type == "click" && !proceedWithoutTimer) {
                                // Only do this when this feature has been enabled in the Settings tabsheet
                                if ($scope.config.noClickWhenDblClick) {
                                    // Only do this if a double click handler has been registered, to avoid that all click events would become delayed.
                                    if (svgElement.hasAttribute("data-event_dblclick")) {
                                        if ($scope.clickTimer && $scope.clickTimerTarget != evt.target) {
                                            $scope.clickCount = 0;
                                            clearTimeout($scope.clickTimer);
                                            $scope.clickTimerTarget = null;
                                            $scope.clickTimer = null;                                        
                                        }
                                        
                                        $scope.clickCount++;
                                        var currentTarget = evt.currentTarget;
                                                                                               
                                        if (!$scope.clickTimer) {
                                            $scope.clickTimerTarget = evt.target;
                                            $scope.clickTimer = setTimeout(function() {
                                                if ($scope.clickCount < 2) {
                                                     // The event.currentTarget will only be available during the event handling, and will become null afterwards
                                                    // (see https://stackoverflow.com/a/66086044).  So let's restore it here...
                                                    // Since currentTarget is a readonly property, it needs to be overwritten via following trick:
                                                    Object.defineProperty(evt, 'currentTarget', {writable: false, value: currentTarget});
                                                    
                                                    handleEvent(evt, true);
                                                }
                                                
                                                $scope.clickCount = 0;
                                                clearTimeout($scope.clickTimer);
                                                $scope.clickTimerTarget = null;
                                                $scope.clickTimer = null;
                                            }, 400);
                                        }
                                        
                                        return;
                                    }
                                }
                            }
                            
                            var userData = svgElement.getAttribute("data-event_" + evt.type);
                                        
                            if (!userData) {
                                logError("No user data available for this " + evt.type + " event");
                                return;
                            }

                            userData = JSON.parse(userData);

                            // In version 1.x.x there was a bug (msg.elementId contained the selector instead of the elementId).
                            // This was fixed in version 2.0.0
                            var msg = {
                                elementId  : userData.elementId,
                                selector   : userData.selector,
                                payload    : userData.payload,
                                payloadType: userData.payloadType,
                                topic      : userData.topic
                            }
                            
                            msg.event = {
                                type: evt.type
                            }

                            if (evt.type === "change") {
                                // Get the new value from the target element
                                if (event.target.type === "number") {
                                    msg.event.value = event.target.valueAsNumber;
                                }
                                else {
                                    msg.event.value = event.target.value;
                                }
                            }
                            else {
                                if (evt.changedTouches) {
                                    // For touch events, the coordinates are stored inside the changedTouches field
                                    // - touchstart event: list of the touch points that became active with this event (fingers started touching the surface).
                                    // - touchmove event: list of the touch points that have changed since the last event.
                                    // - touchend event: list of the touch points that have been removed from the surface (fingers no longer touching the surface).
                                    var touchEvent = evt.changedTouches[0];
                                        
                                    msg.event.pageX   = Math.trunc(touchEvent.pageX);
                                    msg.event.pageY   = Math.trunc(touchEvent.pageY);
                                    msg.event.screenX = Math.trunc(touchEvent.screenX);
                                    msg.event.screenY = Math.trunc(touchEvent.screenY);
                                    msg.event.clientX = Math.trunc(touchEvent.clientX);
                                    msg.event.clientY = Math.trunc(touchEvent.clientY);
                                }
                                else {
                                    msg.event.pageX   = Math.trunc(evt.pageX);
                                    msg.event.pageY   = Math.trunc(evt.pageY);
                                    msg.event.screenX = Math.trunc(evt.screenX);
                                    msg.event.screenY = Math.trunc(evt.screenY);
                                    msg.event.clientX = Math.trunc(evt.clientX);
                                    msg.event.clientY = Math.trunc(evt.clientY);
                                }

                                // Get the mouse coordinates (with origin at left top of the SVG drawing)
                                if(msg.event.pageX !== undefined && msg.event.pageY !== undefined){
                                    var pt = $scope.svg.createSVGPoint();
                                    pt.x = msg.event.pageX;
                                    pt.y = msg.event.pageY;
                                    pt = pt.matrixTransform($scope.svg.getScreenCTM().inverse());
                                    
                                    msg.event.svgX = Math.trunc(pt.x);
                                    msg.event.svgY = Math.trunc(pt.y);
                                    
                                    // Get the SVG element where the event has occured (e.g. which has been clicked)
                                    var svgElement = $(evt.target)[0];
                                    
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
                                        Math.trunc(bbox.left),
                                        Math.trunc(bbox.bottom),
                                        Math.trunc(bbox.right),
                                        Math.trunc(bbox.top)
                                    ]
                                }
                            }
                            
                            $scope.send(msg);
                        }
                        
                        function handleJsEvent(evt, proceedWithoutTimer) {
                            // No need to do this twice: for proceedWithoutTimer=true the click event has already passed here before (with proceedWithoutTimer=null)
                            if (!proceedWithoutTimer) {
                                // PreventDefault to avoid the default browser context menu to popup, in case an event handler has been specfied in this node.
                                // See https://github.com/bartbutenaers/node-red-contrib-ui-svg/pull/93#issue-855852128
                                evt.preventDefault();
                                evt.stopPropagation();
                                
                                logEvent("JS event " + evt.type + " has occured");
                            }
                            
                            // Get the SVG element where the event has occured (e.g. which has been clicked).
                            // Caution: You can add an event handler to a group, which is called when one of the (sub)elements of that group receives that event (e.g. 
                            // when that (sub)element is being clicked).  The event will bubble from the clicked (sub)element, up until the group element is reached.
                            // At that point we will arrive in this event handler:
                            // - evt.target will refer to the (sub)element that received the event
                            // - evt.currentTarget will refer to the group element to which the event handler is attached.
                            // Since our data-event_xxx attributes are available in the element that has the event handler, we will need to use evt.currentTarget !!
                            // See https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/97
                            var svgElement = $(evt.currentTarget)[0];
                            
                            if (!svgElement) {
                                logError("No SVG element has been found for this " + evt.type + " event");
                                return;
                            }

                            // When a shape has both a single-click and a double-click event handler.  Then a double click will result in in two single click events,
                            // followed by a double click event.  See https://discourse.nodered.org/t/node-red-contrib-ui-svg-click-and-dblclick-in-same-element/50203/6?u=bartbutenaers
                            // To prevent the single-clicks from occuring in this case, we start a timer of 400 msec.  If more than 1 click event occurs during
                            // that interval, it is considered as a double click (so the single clicks are ignored).
                            if (evt.type == "click" && !proceedWithoutTimer) {
                                // Only do this when this feature has been enabled in the Settings tabsheet
                                if ($scope.config.noClickWhenDblClick) {
                                    // Only do this if a double click handler has been registered, to avoid that all click events would become delayed.
                                    if (svgElement.hasAttribute("data-js_event_dblclick")) {
                                        if ($scope.clickJsTimer && $scope.clickJsTimerTarget != evt.target) {
                                            $scope.clickJsCount = 0;
                                            clearTimeout($scope.clickJsTimer);
                                            $scope.clickJsTimerTarget = null;
                                            $scope.clickJsTimer = null;                                        
                                        }
                                        
                                        $scope.clickJsCount++;
                                        var currentTarget = evt.currentTarget;
                                                                        
                                        if (!$scope.clickJsTimer) {
                                            $scope.clickJsTimerTarget = evt.target;
                                            $scope.clickJsTimer = setTimeout(function() {
                                                if ($scope.clickJsCount < 2) {
                                                    // The event.currentTarget will only be available during the event handling, and will become null afterwards
                                                    // (see https://stackoverflow.com/a/66086044).  So let's restore it here...
                                                    // Since currentTarget is a readonly property, it needs to be overwritten via following trick:
                                                    Object.defineProperty(evt, 'currentTarget', {writable: false, value: currentTarget});
                                                    
                                                    handleJsEvent(evt, true);
                                                }
                                                
                                                $scope.clickJsCount = 0;
                                                clearTimeout($scope.clickJsTimer);
                                                $scope.clickJsTimerTarget = null;
                                                $scope.clickJsTimer = null;
                                            }, 400);
                                        }

                                        return;
                                    }
                                }
                            }
                            
                            var userData = svgElement.getAttribute("data-js_event_" + evt.type);
                                        
                            if (!userData) {
                                logError("No user data available for this " + evt.type + " javascript event");
                                return;
                            }
                            
                            userData = JSON.parse(userData);

                            try {
                                // Make sure the $scope variable is being used once here inside the handleJsEvent function, to make
                                // sure it becomes available to be used inside the eval expression.
                                $scope;
                                
                                if ($scope.config.enableJsDebugging) { debugger; }
                                
                                // Execute the specified javascript function.
                                eval(userData.sourceCode || "");
                            }
                            catch(err) {
                                logError("Error in javascript event handler: " + err);
                            }
                        }

                        function applyEventHandlers(rootElement) {
                            if ($scope.config.clickableShapes) {
                                // The event handlers that send a message to the server
                                $scope.config.clickableShapes.forEach(function(clickableShape) {
                                    // CAUTION: The "targetId" now contains the CSS selector (instead of the element id).  
                                    //          But we cannot rename it anymore in the stored json, since we don't want to have impact on existing flows!!!
                                    //          This is only the case for clickable shapes, not for animations (since there is no CSS selector possible)...
                                    if (!clickableShape.targetId) {
                                        return;
                                    }
                                    var elements = rootElement.querySelectorAll(clickableShape.targetId); // The "targetId" now contains the CSS selector!

                                    if (elements.length === 0) {
                                        logError("No elements found for selector '" + clickableShape.targetId + "'");
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

                                        // Store all the user data in a "data-event_<event>" element attribute, to have it available in the handleEvent function
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
                                })
                            }
     
                            if ($scope.config.javascriptHandlers) {
                                // The Javascript event handlers
                                $scope.config.javascriptHandlers.forEach(function(javascriptHandler) {
                                    // The "msg" event handler will be executed somewhere else (i.e. as a message watch)
                                    if (javascriptHandler.action !== "msg") {
                                        var elements = rootElement.querySelectorAll(javascriptHandler.selector);
                                        
                                        if (elements.length === 0) {
                                            logError("No elements found for selector '" + javascriptHandler.selector + "'");
                                        }
                                        
                                        var action = javascriptHandler.action || "click" ;
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
                                            
                                            // The javascript event handler source code is base64 encoded, so let's decode it.
                                            var sourceCode = atob(javascriptHandler.sourceCode);
                                            
                                            // Store the javascript code in a "data-js_event_<event>" element attribute, to have it available in the handleJsEvent function
                                            element.setAttribute("data-js_event_" + action,  JSON.stringify({
                                                elementId  : element.id,
                                                selector   : javascriptHandler.selector,
                                                sourceCode : sourceCode
                                            }));
                                            
                                            // Make sure we don't end up with multiple handlers for the same event
                                            element.removeEventListener(action, handleJsEvent, false);
                                            
                                            element.addEventListener(action, handleJsEvent, false);
                                        })
                                    }
                                })
                            }
                        }

                        function initializeSvg(scope) {
                            $scope.clickCount = 0;
                            $scope.clickJsCount = 0;

                            // Make the element clickable in the SVG (i.e. in the DIV subtree), by adding an onclick handler to ALL
                            // the SVG elements that match the specified CSS selectors.
                            applyEventHandlers(scope.rootDiv);                           
                            
                            // Apply the animations to the SVG elements (i.e. in the DIV subtree), by adding <animation> elements
                            scope.config.smilAnimations.forEach(function(smilAnimation) {
                                if (!smilAnimation.targetId) {
                                    return;
                                }
                                
                                var element = scope.rootDiv.querySelector("#" + smilAnimation.targetId);
                                
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
                                    
                                    if (smilAnimation.end === "freeze") {
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
                            if (scope.config.showCoordinates && scope.svg) {
                                scope.tooltip = document.getElementById("tooltip_" + scope.config.nodeIdWithoutDot);
                                scope.svg.addEventListener("mousemove", function(evt) {
                                    // Make sure the tooltip becomes visible, when inside the SVG drawing
                                    scope.tooltip.style.display = "block";

                                    // Get the mouse coordinates (with origin at left top of the SVG drawing)
                                    var pt = scope.svg.createSVGPoint();
                                    pt.x = evt.pageX;
                                    pt.y = evt.pageY;
                                    pt = pt.matrixTransform(scope.svg.getScreenCTM().inverse());
                                    pt.x = Math.round(pt.x);
                                    pt.y = Math.round(pt.y);
                                    
                                    // Make sure the tooltip follows the mouse cursor (very near).
                                    // Fix https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/28
                                    // - Tooltip not always readable
                                    // - Tooltip doesn't stick to the mouse cursor on Firefox
                                    // - Tooltip should flip when reaching the right and bottom borders of the drawing
                                    
                                    scope.tooltip.innerHTML = `<span style='color:#000000'>${pt.x},${pt.y}</span>`;
                                    
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
                                    var mdCardElement = scope.rootDiv.parentElement;            

                                    if (tooltipX > (mdCardElement.clientWidth - scope.tooltip.clientWidth - 20)) {
                                        // When arriving near the right border of the drawing, flip the tooltip to the left side of the cursor
                                        tooltipX = tooltipX - scope.tooltip.clientWidth - 20;
                                    }
                                    
                                    if (tooltipY > (mdCardElement.clientHeight - scope.tooltip.clientHeight - 20)) {
                                        // When arriving near the bottom border of the drawing, flip the tooltip to the upper side of the cursor
                                        tooltipY = tooltipY - scope.tooltip.clientHeight - 20;
                                    }

                                    scope.tooltip.style.left = (tooltipX + 10) + 'px';
                                    scope.tooltip.style.top  = (tooltipY + 10) + 'px';
                                }, false);

                                scope.svg.addEventListener("mouseout", function(evt) {
                                    // The tooltip should be invisible, when leaving the SVG drawing
                                    scope.tooltip.style.display = "none";
                                }, false);
                            } 
                        }
                        
                        $scope.flag = true;
                        $scope.init = function (config) {
                            $scope.config = config;
                            $scope.faMapping = {};
                            $scope.rootDiv = document.getElementById("svggraphics_" + config.nodeIdWithoutDot);
                            $scope.svg = $scope.rootDiv.querySelector("svg");
                            $scope.isObject = function(obj) {
                                return (obj != null && typeof obj === 'object' && (Array.isArray(obj) === false));    
                            }
                            $scope.events = ["click", "dblclick", "change", "contextmenu", "mouseover", "mouseout", "mouseup", "mousedown", 
                                             "focus", "focusin", "focusout", "blur", "keyup", "keydown", "touchstart", "touchend", "change"];
                            
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
                                
                                panZoomOptions.handleStartEvent = function(event) {
                                    // On the first pointer event (when panning starts) the default Panzoom behavior is:
                                    //   1.- Call event.preventDefault()
                                    //   2.- Call event.stopPropagation(): to enable Panzoom elements within Panzoom elements.
                                    // We will override that behaviour by not calling event.preventDefault(), otherwise our svg
                                    // event handler won't be triggered (so no output message would be send).
                                    event.stopPropagation();
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
                                
                                if (config.doubleClickZoomEnabled) {
                                    // Zoom in when tapped twice on a touch screen.  Next time zoom out, and so on ...
                                    // We will need to use hammer.js for this (see https://github.com/timmywil/panzoom/issues/275).
                                    // Make sure to pass the SVG element, instead of the parent DIV element (see https://github.com/hammerjs/hammer.js/issues/1119).
                                    $scope.mc = new Hammer.Manager($scope.svg);
                                    $scope.mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
                                    $scope.mc.on('doubletap', function (evt) {
                                        var dblClickZoomFactor;
                                        // Old nodes might not have a, so use a default value of 100%
                                        var dblClickZoomPercentage = parseInt($scope.config.dblClickZoomPercentage || 100);

                                        if (dblClickZoomPercentage < 100) {
                                            logError("The double click percentage should be >= 100%");
                                            return;
                                        }
                                      
                                        if (!$scope.previousTouchEvent || $scope.previousTouchEvent === "zoomOut") {
                                            // Convert e.g. 130% to a factor 1.3
                                            dblClickZoomFactor = dblClickZoomPercentage / 100;

                                            $scope.previousTouchEvent = "zoomIn";
                                        }
                                        else {
                                            // Use zoom factor 1 to restore the original status
                                            dblClickZoomFactor = 1;

                                            $scope.previousTouchEvent = "zoomOut";
                                        }
                                        
                                        // Zoom in by the specified percentage, at the location of the double click/tap.
                                        // Which means that the center of the transform is the location of the double click/tap.
                                        // So the SVG object below the double click/tap will become the center of the transformation.
					// Because by default the PanZoom library takes the upper left (0,0) corner as center of the transformation...
                                        $scope.panZoomModule.zoomToPoint(dblClickZoomFactor, {clientX: evt.center.x, clientY: evt.center.y});
                                    });
                                }
                            }

                            initializeSvg($scope);
                            
                            if (config.sendMsgWhenLoaded) {
                                $scope.send({
                                    payload: config.id,
                                    topic: "loaded"
                                });    
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
                                    if ((typeof(obj) === 'object') && (k in obj)) {
                                        obj = obj[k];
                                    } else {
                                        return def;
                                    }
                                }
                                return obj;
                            }             
                            function processCommand(_msgid, payload, topic){
                                var selector, elements, attrElements, textElements;
                                try {
                                    $scope.config.javascriptHandlers.forEach(function(javascriptHandler) {
                                        // The "msg" event handler will be executed somewhere else (i.e. as a message watch)
                                        if (javascriptHandler.action === "msg") {
                                            try {
                                                // Make sure the $scope variable is being used once here inside the handleJsEvent function, to make
                                                // sure it becomes available to be used inside the eval expression.
                                                $scope;
                                                
                                                // The javascript event handler source code is base64 encoded, so let's decode it.
                                                var sourceCode = atob(javascriptHandler.sourceCode);
                                                
                                                if ($scope.config.enableJsDebugging) { debugger; }
                                                
                                                // Execute the specified javascript function.
                                                eval(sourceCode || "");
                                            }
                                            catch(err) {
                                                logError("Error in javascript input msg handler (msg._msgid = '" + _msgid + "'): " + err);
                                            }
                                        }
                                    });
                                    
                                    if(topic){
                                        if(topic == "custom_msg") {
                                            // do nothing
                                            return;
                                        }
                                        else if(topic == "databind"){
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

                                                        switch (bindType) {
                                                            case "text":
                                                                setTextContent(element, bindValue);
                                                                break;
                                                            case "attr":
                                                                element.setAttribute(attributeName, bindValue);
                                                                break;
                                                            case "style":
                                                                element.style[attributeName] = bindValue;
                                                                break;
                                                        }
                                                    } 
                                                });
                                            });

                                            // Bind elements with custom attributes (data-bind-text).  For example:
                                            //
                                            //    <svg ...>
                                            //       <text data-bind-text="payload.SystemStateDesc" ...>Temporary text content</text>
                                            //    </svg>
                                            //
                                            // Then the text content can be updated by injecting the following message:
                                            //
                                            //    {"payload":{"SystemStateDesc":"testing testing"}, "topic":"databind"}
                                            //
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
                                            
                                            // Bind elements with custom attributes (data-bind-attributes/data-bind-values).  For example:
                                            //
                                            //    <svg ...>
                                            //       <circle data-bind-attributes="fill,r" data-bind-values="payload.circleColour,payload.size" ...>;
                                            //    </svg>
                                            //
                                            // Then the circle fill color and radius attributes can be updated by injecting following message:
                                            //    {"payload":{"fill":"circleColour", "size":25}, "topic":"databind"}
                                            //
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
                                                            logError("data-bind-attributes count is different to data-bind-values count (msg._msgid = '" + _msgid + "')");
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
                                                        logError("Invalid selector. No SVG elements found for selector " + selector + "(msg._msgid = '" + _msgid + "')");
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

                                    // !!!!!!!!!!!!! When adding a case statement, add the option also to node.availableCommands above !!!!!!!!!!!!!
                                    // Make sure the commands are not case sensitive anymore
                                    switch (op.toLowerCase()) {
                                        case "replace_svg":
                                            if (!payload.svg || (typeof payload.svg !== "string")) {
                                                logError("Invalid payload. The payload should be an SVG string (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
                                            
                                            try {
                                                // Try to load the SVG string in the msg.payload.svg
                                                var parser = new DOMParser();
                                                var newDocument = parser.parseFromString(payload.svg, "image/svg+xml");
                                                var newSvg = newDocument.children[0];
                                            }
                                            catch (err) {
                                                logError("Invalid payload.svg.  No valid SVG string (msg._msgid = '" + _msgid + "'): " + err);
                                                return;
                                            }
                                            
                                            if (newSvg.tagName !== "svg") {
                                                logError("Invalid payload. The tag of the first element should be 'svg' (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
                                            
                                            // We won't replace the current $scope.svg element by the newSvg element.
                                            // Because the current $scope.svg element is already in use in a couple of places (e.g. in the panzoom library).
                                            // Instead we will clone all attributes and children from the newSvg element to the current $scope.svg element:
                                            
                                            // Remove the current attributes from the current $scope.svg element
                                            while($scope.svg.attributes.length > 0) {
                                                $scope.svg.removeAttribute($scope.svg.attributes[0].name);
                                            }
                                            
                                            // Add the new attributes from the new SVG element, to the current $scope.svg element
                                            for(var i = 0; i < newSvg.attributes.length; i++) {
                                                var newAttribute = newSvg.attributes[i];
                                                $scope.svg.setAttribute(newAttribute.name, newAttribute.value);
                                            }
                                            
                                            // Add the children of the new SVG element to the current current $scope.svg element.
                                            // Caution: don't use appendChild, because then they won't show up!
                                            // https://stackoverflow.com/questions/35784290/how-to-add-a-svg-object-created-with-domparser-from-a-string-into-a-div-elemen
                                            $scope.svg.innerHTML = newSvg.innerHTML;
                                            
                                            initializeSvg($scope);
                                            break;
                                        case "get_svg":
                                            var xml = (new XMLSerializer()).serializeToString($scope.svg);
                                            
                                            $scope.send({
                                                payload: xml,
                                                topic:"get_svg"
                                            }); 
                                            break;
                                        case "add_element": // Add elements, or replace them if they already exist
                                            if (!payload.elementType) {
                                                logError("Invalid payload. A property named .elementType is not specified (msg._msgid = '" + _msgid + "')");
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
                                                logError("When multiple parent SVG elements are specified, it is not allowed to specify an .elementId (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
                                        
                                            // Create a new SVG element (of the specified type) to every specified parent SVG element
                                            parentElements.forEach(function(parentElement){
                                                var newElement;
                                                
                                                if (payload.foreignElement == true) {
                                                    newElement = document.createElement(payload.elementType);
                                                }
                                                else {
                                                    newElement = document.createElementNS("http://www.w3.org/2000/svg", payload.elementType);
                                                }
                                                
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

                                                    if (style.trim() !== "") {
                                                       newElement.setAttribute("style", style);
						    }
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
                                                logError("Invalid payload. A property named .elementId or .selector is not specified (msg._msgid = '" + _msgid + "')");
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
                                                logError("Invalid payload. A property named .elementId or .selector is not specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }  
                                    
                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector + " (msg._msgid = '" + _msgid + "')");
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
                                                payload: elementArray,
                                                topic:"get_text"
                                            });                                             
                                            break;
                                        case "update_text":
                                        case "update_innerhtml"://added to make adding inner HTML more readable/logical
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }  

                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector + "(msg._msgid = '" + _msgid + "')");
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
                                                logError("Invalid payload. A property named .elementId or .selector is not specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }  
                                            
                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector + "(msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
                                            if (payload.style && $scope.isObject(payload.style)) {
                                                elements.css(payload.style);
                                            } else if(payload.attributeName) {
                                                elements.css(payload.attributeName, payload.attributeValue);
                                            } else {
                                                logError("Cannot update style! style object not valid or attributeName/attributeValue strings not provided (selector '" + selector + "' and msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
                                            break;
                                        case "update_value":  
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }  
                                            
                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector + "(msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
                                            elements.forEach(function(element){
                                                if(element.value === undefined) {
                                                    logError("An SVG element selected by '" + selector + "' has no 'value' property (msg._msgid = '" + _msgid + "')");
                                                    return
                                                }
                                                element.value = payload.value;
                                                
                                                // Force the onChange event handlers on the element to be called.  The setAttribute doesn't trigger 
                                                // those event handlers, because they are only triggered when the element looses focus.
                                                element.dispatchEvent(new Event('change'));
                                            });
                                            break;
                                        case "update_attribute":
                                        case "set_attribute": //fall through 
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }  
                                            
                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector + "(msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
                                            elements.forEach(function(element){
                                                if (op == "update_attribute") {
                                                    if(!element.hasAttribute(payload.attributeName)) {
                                                        logError("An SVG element selected by '" + selector + "' has no attribute with name '" + payload.attributeName + "' (msg._msgid = '" + _msgid + "')");
                                                        return
                                                    }
                                                }
                                                if(!payload.attributeValue){
                                                    element.removeAttribute(payload.attributeName);
                                                }
                                                else {
                                                    element.setAttribute(payload.attributeName, payload.attributeValue);
                                                }
                                            });
                                            break;
                                        case "remove_attribute":
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }  
                                            
                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector + " (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
                                            elements.forEach(function(element){
                                                if(element.hasAttribute(payload.attributeName)) {
                                                    element.removeAttribute(payload.attributeName);
                                                }
                                            });
                                            break;
                                        case "replace_attribute":
                                        case "replace_all_attribute":
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
                                            if (!payload.regex) {
                                                logError("Invalid payload. A regular expression should be specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }   
                                            if (!payload.replaceValue) {
                                                logError("Invalid payload. A replace value should be specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }   
                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector + " (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
                                            elements.forEach(function(element){
                                                if(!element.hasAttribute(payload.attributeName)) {
                                                    logError("An SVG element selected by '" + selector + "' has no attribute with name '" + payload.attributeName +"' (msg._msgid = '" + _msgid + "')");
                                                    return;
                                                }
                                                
                                                var attributeValue = element.getAttribute(payload.attributeName);
                                                
                                                var regex = (op == "replace_attribute") ? new RegExp(payload.regex) : new RegExp(payload.regex, 'g');
                                                
                                                if (!regex.test(attributeValue)) {
                                                    logError("The value of attribute " + payload.attributeName + " does not match the regex (msg._msgid = '" + _msgid + "')");
                                                    return;
                                                }
                                                
                                                var replacedAttribute = attributeValue.replace(regex, payload.replaceValue)
                                                element.setAttribute(payload.attributeName, replacedAttribute);
                                            });
                                            break;
                                        case "trigger_animation":
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }  
                                            
                                            selector = payload.selector || ("#" + payload.elementId);
                                            elements = $scope.rootDiv.querySelectorAll(selector);
                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector + "(msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
                                            if (!payload.action) {
                                                logError("When triggering an animation, there should be a .action field (msg._msgid = '" + _msgid + "')");
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
                                                                logError("Error calling " + payload.elementId + "." + payload.action + "() (msg._msgid = '" + _msgid + "')");
                                                            }
                                                            break;
                                                    }
                                                }

                                            });
                                            break;    
                                        case "add_event":// add the specified event(s) to the specified element(s)
                                        case "remove_event":// remove the specified event(s) from the specified element(s)
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }  

                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);

                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector + " (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }

                                            if (!payload.event) {
                                                logError("No msg.payload.event has been specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }

                                            if (!$scope.events.includes(payload.event)) {
                                                logError("The msg.payload.event contains an unsupported event name (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }

                                            elements.forEach(function(element) {
                                                // Get all the user data in a "data-<event>" element attribute
                                                var userData = element.getAttribute("data-event_" + payload.event);
                                            
                                                if (op === "add_event") {
                                                    if (userData) {
                                                        logError("The event " + payload.event + " already has been registered (msg._msgid = '" + _msgid + "')");
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
                                                        logError("The event " + payload.event + " was not registered yet (msg._msgid = '" + _msgid + "')");
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
                                        case "add_js_event":// add the specified Javascript event(s) to the specified element(s)
                                        case "remove_js_event":// remove the specified Javascript event(s) from the specified element(s)
                                            if (!payload.elementId && !payload.selector) {
                                                logError("Invalid payload. A property named .elementId or .selector is not specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }  

                                            selector = payload.selector || "#" + payload.elementId;
                                            elements = $scope.rootDiv.querySelectorAll(selector);

                                            if (!elements || !elements.length) {
                                                logError("Invalid selector. No SVG elements found for selector " + selector + "(msg._msgid = '" + _msgid + "')");
                                                return;
                                            }

                                            if (!payload.event) {
                                                logError("No msg.payload.event has been specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }

                                            if (!$scope.events.includes(payload.event)) {
                                                logError("The msg.payload.event contains an unsupported javascript event name (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }

                                            elements.forEach(function(element) {
                                                // Get all the user data in a "data-js_event_<event>" element attribute
                                                var userData = element.getAttribute("data-js_event_" + payload.event);
                                            
                                                if (op === "add_js_event") {
                                                    if (userData) {
                                                        logError("The javascript event " + payload.event + " already has been registered (msg._msgid = '" + _msgid + "')");
                                                    }
                                                    else {
                                                        // Seems the event has been registered yet for this element, so let's do that now ...
                                                        element.addEventListener(payload.event, handleJsEvent, false);
                                                        
                                                        // Store all the user data in a "data-event_<event>" element attribute, to have it available in the handleEvent function
                                                        element.setAttribute("data-js_event_" + payload.event, JSON.stringify({
                                                            elementId  : element.id,
                                                            selector   : selector, 
                                                            sourceCode : payload.script
                                                        }));
                                                        
                                                        element.style.cursor = "pointer";
                                                    }
                                                }
                                                else { // "remove_js_event"
                                                    if (!userData) {
                                                        logError("The javascript event " + payload.event + " was not registered yet (msg._msgid = '" + _msgid + "')");
                                                    }
                                                    else {
                                                        element.removeEventListener(payload.event, handleJsEvent, false);
                                                        
                                                        // Remove all the user data in a "data-js_event_<event>" element attribute
                                                        element.removeAttribute("data-js_event_" + payload.event);
                                                        
                                                        element.style.cursor = "";
                                                    }
                                                }
                                            });                                               
                                            break;
                                        case "zoom_in":
                                            if (!$scope.panZoomModule) {
                                                logError("Cannot zoom via input message, when zooming is not enabled in the settings (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
                                        
                                            $scope.panZoomModule.zoomIn();
                                            break;
                                        case "zoom_out":
                                            if (!$scope.panZoomModule) {
                                                logError("Cannot zoom via input message, when zooming is not enabled in the settings (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }

                                            $scope.panZoomModule.zoomOut();
                                            break;
                                        case "zoom_by_percentage":
                                            if (!$scope.panZoomModule) {
                                                logError("Cannot zoom via input message, when zooming is not enabled in the settings (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }

                                            if (!payload.percentage) {
                                                logError("No msg.payload.percentage has been specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
                                            
                                            // Convert e.g. 130% to a factor 1.3
                                            var factor = payload.percentage / 100;
                                            
                                            // Optionally point coordinates can be specified in the input message
                                            if (payload.x && payload.y) {
                                                // The msg contains svg coordinates, while the zoomToPoint function expects client coordinates.
                                                var clientX = $scope.svg.getBoundingClientRect().x + payload.x;
                                                var clientY = $scope.svg.getBoundingClientRect().y + payload.y;
 
                                                // When a point has been specified, zoom by the specified percentage at the specified point
                                                $scope.panZoomModule.zoomToPoint(factor, {clientX: clientX, clientY: clientY});
                                            }
                                            else {
                                                // No point has been specified, so zoom by the specified percentage
                                                $scope.panZoomModule.zoom(factor);
                                            }
                                            break;
                                        case "pan_to_point":    
                                            if (!$scope.panZoomModule) {
                                                logError("Cannot pan via input message, when panning is not enabled in the settings (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }

                                            if (!payload.x || !payload.y) {
                                                logError("No point coordinates (msg.payload.x msg.payload.y) have been specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
    
                                            // Pan (absolute) to rendered point
                                            $scope.panZoomModule.pan(msg.payload.x, msg.payload.y);
                                            break;
                                        case "pan_to_direction": 
                                            if (!$scope.panZoomModule) {
                                                logError("Cannot pan via input message, when panning is not enabled in the settings (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }

                                            if (!payload.x || !payload.y) {
                                                logError("No direction coordinates (msg.payload.x msg.payload.y) have been specified (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }
    
                                            // Pan (relative) by x/y of rendered pixels into a direction
                                            $scope.panZoomModule.pan(msg.payload.x, msg.payload.y, { relative: true });
                                            break;
                                        case "reset_panzoom":
                                            if (!$scope.panZoomModule) {
                                                logError("Cannot pan via input message, when panning is not enabled in the settings (msg._msgid = '" + _msgid + "')");
                                                return;
                                            }

                                            $scope.panZoomModule.reset();
                                            break;

                                        default:
                                            if (msg.topic) {
                                                logError("Unsupported msg.topic '" + msg.topic + "' (msg._msgid = '" + _msgid + "')");
                                            }
                                            else {
                                                logError("Unsupported command '" + payload.command + "' (msg._msgid = '" + _msgid + "')");
                                            }
                                    }
                                    
                                } 
                                catch (error) {
                                    logError("Unexpected error when processing input message (msg._msgid = '" + _msgid + "'): " + error); 
                                }
                            }

                            var payload = msg.payload;
                            var topic = msg.topic;
                            var enabled = msg.enabled;

                            // The Node-RED dashboard framework automatically disables/enables all user input when msg.enabled is supplied.
                            // We only need to make sure here the Debug panel is not filled with error messages about missing payloads.
                            // See https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/124
                            if (enabled === false || enabled === true) {
                                if (!msg.payload && !msg.topic) {
                                    return;
                                }
                            }

                            if (!payload || payload === "") {
                                logError("Missing msg.payload (msg._msgid = " + msg._msgid + ")");
                                return;
                            }
                            
                            if(topic == "custom_msg") {
                                processCommand(msg._msgid, payload, topic);
                            }
                            else if(topic == "databind" || ((typeof payload == "string" || typeof payload == "number") && topic)){
                                processCommand(msg._msgid, payload, topic);
                            } else {
                                if(!Array.isArray(payload)){
                                    payload = [payload];
                                }
                                payload.forEach(function(val,idx){
                                    if(typeof val != "object" || !val.command) {
                                        logError("The msg.payload should contain an object (or an array of objects) which have a 'command' property (msg._msgid = " + msg._msgid + ")");
                                    }
                                    else {   
                                        processCommand(msg._msgid, val);
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
   
    // Make all the javascript library files available to the FLOW EDITOR.
    // We use a separate endpoint, since no permissions are required to read those resources.
    // Otherwise we get 'unauthorized' problems, when calling this endpoint from a 'script' tag.
    // See details on https://discourse.nodered.org/t/unauthorized-when-accessing-custom-admin-endpoint/20201/4
    RED.httpAdmin.get('/ui_svg_graphics/lib/:libraryname', function(req, res){ 
        // Send the requested js library file to the client
        switch (req.params.libraryname) {
            case "beautify-html.js":
                // The html beautifier is used to beautify the SVG source
                if (jsBeautifyHtmlPath) {
                    res.sendFile(jsBeautifyHtmlPath);
                    return;
                }
                break;
            case "beautify-css.js":
                // The css beautifier is used to beautify the CSS source
                if (jsBeautifyCssPath) {
                    res.sendFile(jsBeautifyCssPath);
                    return;
                }
                break;
            case "jschannel.js":
                var absoluteFilePath = path.join(__dirname, "lib", req.params.libraryname);
        
                // We use a local library (package inside this repository), since the jschannel NPM package contains an obsolete version!
                res.sendFile(absoluteFilePath);
                return;
        }
        
        res.writeHead(404);
        return res.end("The requested library is not supported");
    });
        
    // Make all the specified image files available to the FLOW EDITOR.
    RED.httpAdmin.get('/ui_svg_graphics/image/:nodeid/:relativefilepath', RED.auth.needsPermission('ui_svg_graphics.read'), function(req, res) {
        // The client has replaced the dots in the node id by underscores, since dots are not allowed in urls
        var nodeId = req.params.nodeid.replace("_", ".");
        
        var svgNode = RED.nodes.getNode(nodeId);
        
        if (!svgNode) {
            res.writeHead(404);
            return res.end("Svg node with id=" + nodeId + " cannot be found");
        }
        
        if (!svgNode.directory || svgNode.directory === "") {
            res.writeHead(404);
            return res.end("No local image directory has been specified for node with id = " + nodeId);
        }
        
        var absoluteFilePath = path.join(svgNode.directory, req.params.relativefilepath);

        if (fs.existsSync(absoluteFilePath)) {
            fs.readFile(absoluteFilePath, function(err, data) {
                if (err) {
                    res.writeHead(404);
                    return res.end("File not found.");
                }
                
                var img = new Buffer(data).toString('base64');

                res.setHeader("Content-Type", mime.getType(absoluteFilePath));
                res.setHeader("Content-Length", img.length);
                res.writeHead(200);

                res.end(img);
            });
        } 
        else {
            res.writeHead(403);
            return res.end("Forbidden.");
        }
    });
    
    // By default the UI path in the settings.js file will be in comment:
    //     //ui: { path: "ui" },
    // But as soon as the user has specified a custom UI path there, we will need to use that path:
    //     ui: { path: "mypath" },
    var uiPath = (RED.settings.ui || {}).path;

    // When there was no ui path specified (i.e. '//ui: { path: "ui" }' not commented out in the settings.js file), then
    // we need to apply the default 'ui' path.  However, when an empty ui path has been specified (i.e. '//ui: { path: "" }'), then
    // we should also use an empty ui path...  See https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/86
    if (uiPath == undefined) {
        uiPath = 'ui';
    }
	
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
                // Send the requested JS library file to the client
                switch (req.params.value) {
                    case "panzoom":
                        res.sendFile(panzoomPath);
                        break;
                    case "hammer":
                        res.sendFile(hammerPath);
                        break;
                }
                break
            default:
                console.log("Unknown command " + req.params.cmd);
                res.status(404).json('Unknown command');
        }
    });
}
