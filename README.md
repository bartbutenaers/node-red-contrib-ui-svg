# node-red-contrib-ui-svg
A Node-RED widget node to show interactive SVG (vector graphics) in the dashboard

Special thanks to [Stephen McLaughlin](https://github.com/Steve-Mcl), my partner in crime for this node!

And also, lots of credits to Joseph Liard, the author of [DrawSvg](#DrawSvg-drawing-editor) for his assistance!

| :warning: Please have a look at the "Getting started" [tutorial](https://github.com/bartbutenaers/node-red-contrib-ui-svg/wiki/Getting-started-with-the-UI-SVG-node) on the wiki  |
|:---------------------------|

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install node-red-contrib-ui-svg
```
It is advised to use ***Dashboard version 2.16.3 or above***.

## Introduction to SVG
Scalable Vector Graphics (SVG) is an XML-based vector image format for two-dimensional graphics with support for interactivity and animation. We won't explain here how it works, because the internet is full of information about it. 

An SVG drawing contains a series of SVG elements, which will be rendered by the browser from top to bottom.  For example:
```
<svg ...>
  <image .../>
  <circle .../>
  <text .../>
</svg>
```
The browser will first draw the (background) image, then the circle (on top of the image), and so on ...

Each of those SVG elements has attributes (fill colour, ...), can respond to events (clicked, ...) and can be animated (e.g. shrink...).

## Node usage

| :boom: HAVE A LOOK AT THE [WIKI](https://github.com/bartbutenaers/node-red-contrib-ui-svg/wiki) FOR STEP-BY-STEP TUTORIALS   |
|:---------------------------|

This node can be used to visualize all kind of graphical stuff in the Node-RED dashboard.  This can range from simple graphics (e.g. a round button, ...) to very complex graphics (floorplans, industrial processes, piping, wiring, ...).  But even those complex graphics will consist out of several simple graphical shapes.  For example, a ***floorplan*** is in fact a simple image of your floor, and a series of other SVG elements (e.g. Fontawesome icons) drawn on top of that (background) image.

Simply deploy your SVG string in the config screen, and the Node-RED dashboard will render your vector graphics:

![svg_demo](https://user-images.githubusercontent.com/14224149/65639986-94e63680-dfe9-11e9-8086-89d78394301b.gif)

But what if you are not familiar with the SVG syntax.  Do not worry, we have integrated a [DrawSvg](#DrawSvg-drawing-editor) drawing editor in the config screen of our node. 

## Config screen tabsheets

The node's config screen consists of a series of tab sheets:

+ [Editor](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/tabsheet_editor.md) tab sheet
+ [SVG](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/tabsheet_SVG.md) tab sheet
+ [Animation](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/tabsheet_animation.md) tab sheet
+ [Event](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/tabsheet_event.md) tab sheet
+ [JS](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/tabsheet_js.md) tab sheet
+ [Binding](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/tabsheet_binding.md) tab sheet
+ [Settings](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/tabsheet_settings.md) tab sheet
+ [CSS](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/tabsheet_CSS.md) tab sheet

## Control via messages
Most of the SVG information can be manipulated by sending input messages to this node.  

### Some general msg guidelines:
+ In most messages, you need to specify on which SVG element(s) the control message needs to be applied.  To specify a single element, the `elementId` field can be specified:
   ```
   "payload": {
        "command": "update_text",
        "elementId": "some_element_id",
        "textContent": "my title"
    }
   ```
   However it is also possible to specify one or more elements via a [CSS selector](https://www.w3schools.com/cssref/css_selectors.asp).  This is a very powerful query mechanism that allows you to apply the control message to multiple SVG elements at once!  For example, set all texts with class 'titleText' to value 'my title':
   ```
   "payload": {
        "command": "update_text",
        "selector": ".titleText", //standard dom selector '#' for id, '.' for class etc.
        "textContent": "my title"
    }
   ```
   This can be used to do the ***same update on multiple elements with a single message***.
   Note that a `selector` can also be used to specify a single element id (similar to `elementId`), by using a hashtag like *"#some_element_id"*.
+ A message can contain a single command.  For example:
   ```
   "payload": {
       "command": "update_attribute",
       "selector": "#cam_living_room",
       "attributeName": "fill",
       "attributeValue": "orange"
   }
   ```
   But it is also possible to specify ***multiple commands (as an array)*** in a single control message.  For example:
   ```
   "payload": [
        {
           "command": "update_attribute",
           "elementId": "cam_kitchen", /*use elementId or selector*/
           "attributeName": "fill",
           "attributeValue": "orange"
        },
        {
           "command": "set_attribute",
           "selector": "#cam_living", /*use elementId or selector*/
           "attributeName": "fill",
           "attributeValue": "red"
        }      
   ]
   ```
   
+ When multiple identical commands are being used in a single message, the message might be simplified by specifying the command inside the ```msg.topic```:
   ```
   "payload": [
        {
           "elementId": "cam_kitchen", /*use elementId or selector*/
           "attributeName": "fill",
           "attributeValue": "orange"
        },
        {
           "selector": "#cam_living", /*use elementId or selector*/
           "attributeName": "fill",
           "attributeValue": "red"
        },        
   ],
   "topic": "update_attribute"
   ```
  This can be used to do ***multiple commands with a single message***.
  
+ To further simplify the message, the CSS selector - when it is required - can also be added to the topic (separated by `|`):
   ```
    {
        "topic": "update_text|#myRect > .faultMessage",
        "payload": "hello"
    }
   ```
   This way the message becomes yet shorter, but you can only use 1 selector or command value (even when the payload contains an array).

### Supported commands:

+ [Update/set an attribute value](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#updateset-an-attribute-value-via-msg) via msg
+ [Update/set a style attribute value](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#updateset-a-style-attribute-value-via-msg) via msg
+ [Remove an attribute](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#remove-an-attribute-via-msg) via msg
+ [Replace an attribute value](https://github.com/bartbutenaers/node-red-contrib-ui-svg/blob/master/docs/msg_control.md#replace-an-attribute-value-via-msg) via msg
+ [Set text content](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#set-text-content-via-msg) via msg
+ [Get text content](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#get-text-content-via-msg) via msg
+ [Start/stop animations](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#startstop-animations-via-msg) via msg
+ [Add events](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#add-events-via-msg) via msg
+ [Remove events](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#remove-events-via-msg) via msg
+ [Add Javascript events](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#add-javascript-events-via-msg) via msg
+ [Remove Javascript events](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#remove-javascript-events-via-msg) via msg
+ [Add elements](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#add-elements-via-msg) via msg
+ [Remove elements](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#remove-elements-via-msg) via msg
+ [Update (input) value](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#update-input-value-via-msg) via msg
+ [Set entire SVG](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#set-entire-svg-via-msg) via msg
+ [Get entire SVG](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#get-entire-svg) via msg
+ [Zoom in/out](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#zoom-inout-via-msg) via msg
+ [Panning](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#panning-via-msg) via msg 
+ [Reset pan/zoom](https://github.com/bartbutenaers/node-red-contrib-ui-svg/tree/master/docs/msg_control.md#reset-panzoom-via-msg) via msg

### Enable/disable the SVG
The Node-RED dashboard allows to enable/disable ui widgets by injecting a message with `msg.enabled` set to a boolean true or false.  This can also be used to enable or disable all user input in an SVG drawing.  Note that all next injected messages will keep being processed while the node is disabled, like with all other UI nodes (i.e. standard behaviour).

![svg_enable](https://github.com/bartbutenaers/node-red-contrib-ui-svg/assets/14224149/f4485aa4-1877-4451-babb-570e95ce03cd)
```
[{"id":"8734fd29475b3ca3","type":"inject","z":"bf0833e74936a0c1","name":"Enable","props":[{"p":"enabled","v":"true","vt":"bool"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","_mcu":{"mcu":false},"x":750,"y":80,"wires":[["662f5a4f61d45302"]]},{"id":"0793ba691f3622e3","type":"debug","z":"bf0833e74936a0c1","name":"Events","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","_mcu":{"mcu":false},"x":1090,"y":80,"wires":[]},{"id":"7f880977992bf324","type":"inject","z":"bf0833e74936a0c1","name":"Disable","props":[{"p":"enabled","v":"false","vt":"bool"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","_mcu":{"mcu":false},"x":750,"y":140,"wires":[["662f5a4f61d45302"]]},{"id":"662f5a4f61d45302","type":"ui_svg_graphics","z":"bf0833e74936a0c1","group":"e8509dc7be30844e","order":1,"width":0,"height":0,"svgString":"<svg x=\"0\" y=\"0\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n   <text id=\"clickable_text\" x=\"40\" y=\"30\" style=\"font: italic 40px serif; fill: red;\">Click me!</text>\n</svg>","clickableShapes":[{"targetId":"#clickable_text","action":"click","payload":"Text clicked","payloadType":"str","topic":"clicked"}],"javascriptHandlers":[],"smilAnimations":[],"bindings":[],"showCoordinates":false,"autoFormatAfterEdit":false,"showBrowserErrors":false,"showBrowserEvents":false,"enableJsDebugging":false,"sendMsgWhenLoaded":false,"noClickWhenDblClick":false,"outputField":"payload","editorUrl":"//drawsvg.org/drawsvg.html","directory":"","panning":"disabled","zooming":"disabled","panOnlyWhenZoomed":false,"doubleClickZoomEnabled":false,"mouseWheelZoomEnabled":false,"dblClickZoomPercentage":150,"cssString":"div.ui-svg svg{\n    color: var(--nr-dashboard-widgetColor);\n    fill: currentColor !important;\n}\ndiv.ui-svg path {\n    fill: inherit;\n}","name":"","_mcu":{"mcu":false},"x":920,"y":80,"wires":[["0793ba691f3622e3"]]},{"id":"e8509dc7be30844e","type":"ui_group","name":"Svg disable demo","tab":"d8520920.0128d8","order":4,"disp":true,"width":"12","collapse":false,"className":"","_mcu":{"mcu":false}},{"id":"d8520920.0128d8","type":"ui_tab","name":"Home","icon":"dashboard","order":3,"disabled":false,"hidden":false}]
```

## Various stuff

### Fontawesome icons
Fontawesome icons are used widely in Node-RED and are in fact little SVG drawings on their own.  They are a very easy way e.g. to represent devices on a floorplan.  Such an icon can easily be added via DrawSvg, as demonstrated in this animation:

![icons via drawsvg](https://user-images.githubusercontent.com/14224149/66722326-17edf600-ee0c-11e9-94b9-225edcc12250.gif)

By specifying an identifier for the icon (like in the above animation), the icon can be updated afterwards via input messages (like any other SVG element).

When you want to enter your SVG source ***manually*** (without using DrawSvg), there is another mechanism provided:

1. Search the [Fontawesome](https://fontawesome.com/v4.7.0/icons/) website for an icon that fits your needs.  For example, 'fa-video-camera'.

2. Create a text element (with font family *"FontAwesome"*) containing that icon name:
   ```
   <text id="camera_living" x="310" y="45" font-family="FontAwesome" fill="blue" stroke="black" font-size="35" text-anchor="middle" alignment-baseline="middle" stroke-width="1">fa-video-camera</text>
   ```
   
3. The result will be the FontAwesome icon at the specified location:

   ![icon](https://user-images.githubusercontent.com/14224149/63217104-29828c80-c140-11e9-957b-22ea8eb9a0ed.png)
   
Some remarks:
+ The node will automatically lookup the ***unicode*** value for that icon, based on this [list](https://fontawesome.com/v4.7.0/cheatsheet/):

   ![unicode](https://user-images.githubusercontent.com/14224149/63217056-9e08fb80-c13f-11e9-8b48-0ec516752d90.png)
   
   As a result, in the generated dashboard html you will see only the unicode value (instead of the original fa-video-camera value):
   ```
   <text id="camera_living" x="310" y="45" font-family="FontAwesome" fill="blue" stroke="black" font-size="35" text-anchor="middle"  alignment-baseline="middle" stroke-width="1">&#xf03d;</text>
   ```
+ Currently [DrawSvg](#DrawSvg-drawing-editor) doesn't support the FontAwesome font.  See this [issue](https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/34).  
   ```diff
   ! This means in the current DrawSvg version you will see "fa-xxx" instead of the FontAwesome icon:

   ```

   ![DrawSvg FA](https://user-images.githubusercontent.com/14224149/65816859-4317f900-e201-11e9-83e8-0d46d06198ef.png)

+ Since FontAwesome icons are displayed in ```<text>``` SVG elements, it is very easy to change the icon using a ***update_text*** (see 'Control messages' section above):

   ![svg_dynamic_icon](https://user-images.githubusercontent.com/14224149/65432498-95c96d80-de1b-11e9-86c1-8ee7aa147d15.gif)

   ```
   [{"id":"f369eb92.6c5558","type":"ui_svg_graphics","z":"553defb0.b99fb","group":"9ec8b304.368cc","order":0,"width":"15","height":"15","svgString":"<!--<svg height=\"100\" width=\"100\"></svg>-->\n\n<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <text id=\"my_text\" x=\"100\" y=\"50\" font-family=\"FontAwesome\" fill=\"blue\" stroke=\"black\" font-size=\"80\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\">fa-thermometer-empty</text>\n</svg>","clickableShapes":[{"targetId":"#camera_living","action":"click","payload":"#camera_living","payloadType":"str","topic":"#camera_living"},{"targetId":"#camera_balcony","action":"click","payload":"#camera_balcony","payloadType":"str","topic":"#camera_balcony"},{"targetId":"#camera_entry","action":"click","payload":"#camera_entry","payloadType":"str","topic":"#camera_entry"}],"smilAnimations":[],"bindings":[{"selector":"#camera_living","bindSource":"payload.attributeValue","bindType":"attr","attribute":"fill"},{"selector":"#camera_entry","bindSource":"payload.attribueValue","bindType":"attr","attribute":"fill"},{"selector":"#camera_balcony","bindSource":"payload.attributeValue","bindType":"attr","attribute":"fill"}],"showCoordinates":true,"autoFormatAfterEdit":false,"outputField":"anotherField","editorUrl":"","directory":"","name":"Home Floor Plan","x":1130,"y":520,"wires":[[]]},{"id":"866e2e46.ba033","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-three-quarters","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-three-quarters\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":820,"y":520,"wires":[["f369eb92.6c5558"]]},{"id":"68c4730b.af00bc","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-full ","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-full\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":790,"y":560,"wires":[["f369eb92.6c5558"]]},{"id":"46183ab5.42fd54","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-empty","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-empty\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":800,"y":400,"wires":[["f369eb92.6c5558"]]},{"id":"501c7f9a.08ac4","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-half ","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-half\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":790,"y":480,"wires":[["f369eb92.6c5558"]]},{"id":"d3ea2538.fa9458","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-quarter","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-quarter\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":800,"y":440,"wires":[["f369eb92.6c5558"]]},{"id":"9ec8b304.368cc","type":"ui_group","z":"","name":"Home Floor Plan","tab":"bb4f2a94.83b338","disp":true,"width":"15","collapse":false},{"id":"bb4f2a94.83b338","type":"ui_tab","z":"","name":"Home Floor Plan","icon":"dashboard","disabled":false,"hidden":false}]
   ```

### Display images
In an SVG drawing, an *"image"* element can be used to display an image inside an SVG drawing.  See this [tutorial](https://github.com/bartbutenaers/node-red-contrib-ui-svg/wiki/Add-an-image-to-an-SVG-drawing) on the wiki for more information!

## Troubleshooting
Some tips and tricks to solve known problems:

1. When SVG ***path*** elements get the same colour as the dashboard theme, like in this example where the shapes become blue:

   ![Dashboard color](https://user-images.githubusercontent.com/14224149/79540632-c2c7c100-8088-11ea-9ba7-6c5dd4f0a842.png)
   
   You can avoid this by applying the fill colour as a ```style``` attribute (e.g. <element style="fill:red" ... />) to the path, instead of as a normal attribute (e.g. <element fill="red" ... />).  And the normal `fill` attribute on an SVG path will get overwritten by the dashboard theme colour...
   
   Remark: drawings created with DrawSvg are already correct, but some third-party editors use the ```fill``` attribute.

2. Some basic input messages validation has been added on the server-side, and validation errors will be showed in the debug side-panel.

3. See the [DrawSvg](#show-browser-errors-on-the-server) how to show client-side errors in your Node-RED debug panel.

   Remark: when N drawings are visible now (e.g. running in N dashboards simultaneously), then N duplicate messages will be displayed (where N can be 0 is no dashboards are open...).

4. If you have doubts that this node is generating the requested SVG DOM structure, you might have a look at it.  Here is briefly explained how to do it using Chrome:
   1. Open the developer tools of your browser, starting from your dashboard window.
   2. Right click on your SVG drawing in the dashboard, and select "Inspect".
   3. Now you should be able to see the generated SVG DOM tree.

5. When the *"show browser errors on the server"* has been activated, the error messages will appear in the left Debug sidebar.  However if lots of messages are being injected, it is difficult to determine which error belongs to which message.  To assist with that, the error message will contain the message id (which caused that error).  So simply put a debug node (to display the input messages), and compare the ***message id*** to find the related message:

   ![message id](https://user-images.githubusercontent.com/14224149/145280978-89c98cc8-816b-472f-8651-7c2df456ccb1.png)
