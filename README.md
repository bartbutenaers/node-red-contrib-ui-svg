# node-red-contrib-ui-svg
A Node-RED widget node to show interactive SVG (vector graphics) in the dashboard

Special thanks to [Stephen McLaughlin](https://github.com/Steve-Mcl), my partner in crime for this node!

And also lots of credits to Joseph Liard, the author of [DrawSvg](#DrawSvg-drawing-editor) for his assistance!

:warning: ***The 2.0.0 release (unfortunately) contains some breaking changes;***
+ `msg.event` has become `msg.event.type`
+ `msg.coordinates.x` has become `msg.event.svgX`
+ `msg.coordinates.y` has become `msg.event.svgY`
+ `msg.position.x` has become `msg.event.pageX`
+ `msg.position.y` has become `msg.event.pageY`
+ The (selector) content has moved from `msg.elementId` to `msg.selector`, and `msg.elementId` now contains the real element id where the event has occurred.  See [here](https://github.com/bartbutenaers/node-red-contrib-ui-svg/wiki/Breaking-change-version-2.0.0) for detailed information.

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

Each of those SVG elements has attributes (fill color, ...), can respond to events (clicked, ...) and can be animated (e.g. shrink...).

## Node usage

:white_check_mark: ***!!!!! SEE OUR [WIKI](https://github.com/bartbutenaers/node-red-contrib-ui-svg/wiki) FOR STEP-BY-STEP TUTORIALS !!!!!***

This node can be used to visualize all kind of graphical stuff in the Node-RED dashboard.  This can range from simple graphics (e.g. a round button, ...) to very complex graphics (floorplans, industrial processes, piping, wiring, ...).  But even those complex graphics will consist out of a number of simple graphical shapes.  For example a ***floorplan*** is in fact a simple image of your floor, and a series of other SVG elements (e.g. Fontawesome icons) drawn on top of that (background) image.

Simply deploy your SVG string in the config screen, and the Node-RED dashboard will render your vector graphics:

![svg_demo](https://user-images.githubusercontent.com/14224149/65639986-94e63680-dfe9-11e9-8086-89d78394301b.gif)

But what if you are not familiar with the SVG syntax.  Don't worry, we have integrated a [DrawSvg](#DrawSvg-drawing-editor) drawing editor in the config screen of our node. 

The node's config screen consists of a series of tabsheets:

### "Editor" tabsheet

Click the button *Open SVG editor* to show the SVG in the [DrawSvg](#DrawSvg-drawing-editor) drawing editor.  
The DrawSvg editor will be be opened in a popup dialog window:

![launch_editor](https://user-images.githubusercontent.com/44235289/66716981-f40ac000-edcb-11e9-96b5-69e11220b71d.gif)

### "SVG source" tabsheet

![editor](https://user-images.githubusercontent.com/14224149/65357446-5faba400-dbf7-11e9-9824-886238dba228.png)

Enter you (XML-based) SVG graphics in this editor.  This can be done in different ways:
+ If you are a die-hard SVG fanatic, you can enter the SVG string manually in the *"SVG Source"* tabsheet.
+ If you prefer to use an SVG drawing editor, you can use the embedded [DrawSvg](#DrawSvg-drawing-editor) editor.
+ If you need very specific types of drawings, you can use a third party SVG editor to create your drawing (and simple paste the generated SVG string into this tabsheet).  Multiple (online) editors are free available, each with their own dedicated speciality:
   + [Floorplanner](http://floorplanner.com)
   + [Floorplancreator](https://floorplancreator.net/#pricing)
   + ...

However:
   + Be aware that those third-party SVG editors could create rather complex SVG strings, which are harder to understand when you want to change them manually afterwards.
   + Be aware that the browser has a lot of work to render all the SVG elements in the drawing!  In some cases it might be useful - to gain performance - to convert your SVG once to an image, and use that as a background image in this SVG node (and draw other shapes on top of that image).  For example in Floorplanner website, the SVG drawing can be saved as a JPEG/PNG image.  That image can be loaded into an SVG *'image'* element, like I have done in the example flows on this readme page ...
      
At the bottom of the "SVG source" tabsheet, a series of buttons are available:

![buttons](https://user-images.githubusercontent.com/14224149/66707892-5621e180-ed48-11e9-8d66-e3add751e7c8.png)

+ *Expand source*: show the SVG source in full screen mode.
+ *Format SVG*: by formatting the SVG source, the source will be beatyfied.  This means the empty lines will be removed, each line will get a single SVG element, indents will be corrected ...

### "Animations" tabsheet

![animations](https://user-images.githubusercontent.com/14224149/65359120-d2b71980-dbfb-11e9-83ea-5bbc6e155673.png)

SVG allows users to animate element attributes over time.  For example you can make the radius of a circle grow in 3 seconds from 10 pixels to 40 pixels. 

Adding animations to your SVG graphics can be done in different ways:
+ *Via the "SVG Source" tabsheet* manually, for die-hard SVG fanatics:
   ```
   <circle id="mycircle" ... r="5" ...>
      <animate id="myanimation" attributeName="r" begin="0s" dur="3s" repeatCount="1" from="10" to="40"/>
   </circle>
   ```
   The animation will be applied by the browser to the parent element (in this example the circle).
   However it is also possible to add an animation element on its own (i.e. not as child element), with a link to the SVG element it needs to be applied to:
   ```
   <circle id="mycircle" ... r="5" .../>
   <animate xlink:href="#mycircle" id="myanimation" attributeName="r" begin="0s" dur="3s" repeatCount="1" from="10" to="40"/>
   ```

+ *Via the "Animations" tabsheet*, to keep the drawing and the animations separated.  Click the *'add'* button to create a new animation record, where following properties need to be entered:
   + ***Animation id***: The id of this SVG animate element (in this example *"myanimation"*).
   + ***Target element id***: The id of the SVG element that you want to animate (in this example *"mycircle"*).
   + ***Class***: By setting a value in class, you can use a selector to start or stop multiple animations. 
   + ***Attribute name***: The name of the element's attribute that you want to animate (in this example *"r"*).
   + ***From***: The attribute value at the start of the animation (in this example *"10"*).
   + ***To***: The attribute value at the end of the animation (in this example *"40"*).
   + ***Duration***: How long the animation will take.
   + ***Repeat count***: How many times the animation needs to be repeated (in this example *"1" which means only once).  Caution: when *"0"* is selected, this means that the animation will be repeated ***"indefinite"***!
   + ***Animation end***: What to do with the new value when the animation is ended.
      + *Freeze new value*: the attribute value will keep the new *'To'* value (in this example *"40"*).  
      + *Restore original value*: the attribute value will be restored to its original value (in this example *"5"*), from the start of the animation.
   + ***Trigger***: Which trigger will result in the animation being started.
      + Input message: the animation will be started by injecting an input message (see below).
      + Time delay: the animation will be started after a specified time.
      + Custom: the animation will be started using standard [begin](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/begin) options.  For example:
      ```
      2s; myRect.click; myAnim.end-400ms
      ```
   
   Creating animations via this tabsheet has the advantage that the SVG source and the animations are being kept separate.  More specifically when the SVG is being created in a third-party SVG editor (which most of the time don't support animations), your manullay inserted animation elements would be overwritten each time you need to update your SVG...
   
   Remark: it is also possible to animate transformations.  Indeed when the attribute name is *"transform"* an extra "animation type" dropdown will appear:

   ![demo_config_screen](https://user-images.githubusercontent.com/14224149/73695310-23766d00-46da-11ea-9960-065dc1bf7004.gif)
   
+ *Via an input message* as explained in the [Control via messages](#control-via-messages) section below.  

### "Events" tabsheet

![events](https://user-images.githubusercontent.com/14224149/65360241-70f8ae80-dbff-11e9-8c6a-65f3a14e22a7.png)

An SVG element can be added here, to make that element able to intercept one of the following events:
+ *Click*: when a mousedown and mouseup on the same element.
+ *Double click*: when a double mouse click on an element.
+ *Context menu*: when a right mouse click on an element.
+ *Mouse down*: when a mouse button is pressed down on an element. 
+ *Mouse up*: when a mouse button is released on an element.
+ *Mouse over*: when the mouse is moved onto an element.
+ *Mouse out*: when the mouse is moved away from an element.
+ *Focus*: when an element receives focus.
+ *Focus in*: when an element is about to receive focus.
+ *Focus out*: when an element is about to lose focus.
+ *Blur*: when an element loses focus.
+ *Key down*: when a key is pressed down.
+ *Key up*: when a key is released.
+ *Touch start*: when a touch event starts (on mobile/tablet only).
+ *Touch end*: when a touch event ends (on mobile/tablet only).

When adding a new line in this tabsheet, a number of properties need to be entered:
+ ***Selector***: the selection of (one or more) SVG elements that needs to intercept events. See the syntax of [css selectors](https://www.w3schools.com/cssref/css_selectors.asp).
+ ***Action***: the event that the shape needs to intercept.
+ ***Payload***: the ```msg.payload``` content of the output message, which will be sent when the event occurs.
+ ***Topic***: the ```msg.topic``` content of the output message, which will be sent when the event occurs.

By default the content will be stored in ```msg.payload``` of the output message.  However when the result needs to end up in ```msg.anotherField```, this message field can be specfied at the top of the tabsheet:

![image](https://user-images.githubusercontent.com/14224149/65385332-dd71cb80-dd2d-11e9-8ae9-7b604d3f077e.png)

Two things will happen when an event occurs on such an SVG element:
1. The mouse ***cursor*** will change when hoovering above the element, to visualize that an element responds to events.
1. An ***output message*** will be send as soon as the element is clicked, with a Node-RED [standard](https://discourse.nodered.org/t/contextmenu-location/22780/71?u=bartbutenaers) format:
   ```
   "elementId": "circle"
   "event": {
      "svgX":28.02083396911621,
      "svgY":78.66666412353516,
      "pageX":1105,
      "pageY":310,
      "screenX":829,
      "screenY":304,
      "clientX":1105,
      "clientY":310,
      "bbox": [
         1076.979248046875,
         311.3333435058594,
         1136.979248046875,
         251.33334350585938
      ]
   }
   "payload": {
      elementId: "cam3spin",
      status: "start"
   }
   "selector": undefined
   "topic": "circle"
   ```
   The coordinates (where the event occurs) in the output message allow the next nodes in the flow to display information at that location.  For example we have developed the [node-red-contrib-ui-contextmenu](https://github.com/bartbutenaers/node-red-contrib-ui-contextmenu) to show a popup context menu in the dashboard above the SVG drawing, at the location where a shape has been clicked.  The following demo explains this combination of both nodes:

   ![2019-09-22_14-12-06](https://user-images.githubusercontent.com/44235289/65387884-149ea780-dd43-11e9-9cd4-a6bb4fb59d65.gif)
   ```
   [{"id":"107fa0c1.cb755f","type":"debug","z":"60ad596.8120ba8","name":"Floorplan output","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":1340,"y":440,"wires":[]},{"id":"58329d91.3fc564","type":"ui_svg_graphics","z":"60ad596.8120ba8","group":"f014eb03.a3c618","order":1,"width":"14","height":"10","svgString":"<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n  <image width=\"889\" height=\"703\" id=\"background\" xlink:href=\"https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg\"/>\n  <circle id=\"pir_living\" cx=\"310\" cy=\"45\" r=\"5\" stroke-width=\"0\" fill=\"#FF0000\"/>\n  <text id=\"camera_living\" x=\"310\" y=\"45\" font-family=\"FontAwesome\" fill=\"blue\" stroke=\"black\" font-size=\"35\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\"></text>\n</svg>","clickableShapes":[{"targetId":"#camera_living","action":"click","payload":"camera_living","payloadType":"str","topic":"camera_living"}],"smilAnimations":[],"bindings":[],"showCoordinates":false,"autoFormatAfterEdit":false,"outputField":"","editorUrl":"http://drawsvg.org/drawsvg.html","directory":"","name":"","x":1140,"y":440,"wires":[["107fa0c1.cb755f"]]},{"id":"f014eb03.a3c618","type":"ui_group","z":"","name":"Floorplan test","tab":"80068970.6e2868","disp":true,"width":"14","collapse":false},{"id":"80068970.6e2868","type":"ui_tab","z":"","name":"SVG","icon":"dashboard","disabled":false,"hidden":false}]
   ```  
   Remark: the `msg.bbox` contains the bounding box (left / bottom / right / top) of the SVG element where the event occurs

Instead of specifying events in the config screen, it is also possible to add or remove events via input messages.  This is explained in the [Control via messages](#control-via-messages) section below.

### "Input bind" tabsheet
As explained in the section [Control via messages](#control-via-messages) below, this node can be controlled via input messages.  For example to change the fill color of circle with id "mycircle" to green.  As a result the input messages need to contain a lot of information (element id, attribute name, attribute value ...), to let this node know what you want it to do.  This means the flow will become quite complex, since a lot of extra nodes are required to put all that information in the message.

Another way to control this node is by using bindings.  This means that you have to specify most of the information in the binding, so the input message will only need to contain the new value itself.  Since the input messages need to contain less information, the flow can be simplified ... 

![bindings](https://user-images.githubusercontent.com/14224149/65362302-2bd87a80-dc07-11e9-9409-76fe1a205abc.png)

Input bindings can be added to link sources (= input message fields) to destinations (= element attribute/text values).   

A number of properties need to be entered:
+ ***Binding source***: the field of the input message that will contain the new value.
+ ***Selector***: the selection of (one or more) SVG elements on which the new attribute value will be applied.  See the syntax of [css selectors](https://www.w3schools.com/cssref/css_selectors.asp).
+ ***Binding destination***: on which attribute of those selected SVG elements the new values will be applied.
   + *Attribute value*: when this option is selected, the value (from the input message) will be applied to an attribute.  This means an extra "attribute name" will have to be specified, to make sure the new value will be applied to the attribute with that name.
   + *Text content*: when this option is selected, the value (from the input message) will be be applied to the inner text content of the element.
   
For example:

![Binding example](https://user-images.githubusercontent.com/14224149/86181786-f6b26e80-bb2e-11ea-8440-3f335b07a3da.png)

When e.g. the input message contains ```msg.payload.position.x```, then that value (250) will be set to the "x" attribute of SVG element with id "camera_living".
   
The following flow shows the above binding example in action:

![Binding demo](https://user-images.githubusercontent.com/44235289/65389024-7b26c400-dd49-11e9-9792-94c6216e53ef.gif)
```
[{"id":"c9ab8554.337588","type":"debug","z":"60ad596.8120ba8","name":"Floorplan output","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":1380,"y":440,"wires":[]},{"id":"56869c57.d65c74","type":"ui_svg_graphics","z":"60ad596.8120ba8","group":"d4ee73ea.a7676","order":1,"width":"14","height":"10","svgString":"<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n  <image width=\"889\" height=\"703\" id=\"background\" xlink:href=\"https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg\" />\n  <text id=\"banner\" x=\"10\" y=\"16\" fill=\"black\" stroke=\"black\" font-size=\"35\" text-anchor=\"left\" alignment-baseline=\"middle\" stroke-width=\"1\">This is the #banner</text>\n  <circle id=\"pir_living\" cx=\"310\" cy=\"45\" r=\"5\" stroke-width=\"0\" fill=\"#FF0000\" />\n  <text id=\"camera_living\" x=\"310\" y=\"45\" font-family=\"FontAwesome\" fill=\"grey\" stroke=\"black\" font-size=\"35\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\"></text>\n</svg> ","clickableShapes":[{"targetId":"#camera_living","action":"click","payload":"camera_living","payloadType":"str","topic":"camera_living"}],"smilAnimations":[],"bindings":[{"selector":"#banner","bindSource":"payload.title","bindType":"text","attribute":""},{"selector":"#camera_living","bindSource":"payload.position.x","bindType":"attr","attribute":"x"},{"selector":"#camera_living","bindSource":"payload.camera.colour","bindType":"attr","attribute":"fill"}],"showCoordinates":false,"autoFormatAfterEdit":false,"outputField":"","editorUrl":"http://drawsvg.org/drawsvg.html","directory":"","name":"","x":1180,"y":440,"wires":[["c9ab8554.337588"]]},{"id":"62a285fb.bd046c","type":"inject","z":"60ad596.8120ba8","name":"databind","topic":"databind","payload":"{\"camera\":{\"colour\":\"yellow\"},\"position\":{\"x\":320},\"title\":\"databind strikes again\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":980,"y":460,"wires":[["56869c57.d65c74"]]},{"id":"132d184e.ff0ab8","type":"inject","z":"60ad596.8120ba8","name":"databind","topic":"databind","payload":"{\"camera\":{\"colour\":\"green\"},\"position\":{\"x\":250},\"title\":\"New banner title by databind\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":980,"y":420,"wires":[["56869c57.d65c74"]]},{"id":"d4ee73ea.a7676","type":"ui_group","z":"","name":"Floorplan test","tab":"b4bb5633.ba92b8","disp":true,"width":"14","collapse":false},{"id":"b4bb5633.ba92b8","type":"ui_tab","z":"","name":"SVG","icon":"dashboard","disabled":false,"hidden":false}]
```

## "Settings" tabsheet

### Show coordinates
When this option is selected, a ***tooltip*** will be displayed to show the current mouse location (i.e. X and Y coordinate):

![svg_tooltip_coordinates](https://user-images.githubusercontent.com/14224149/63231067-79cc1e00-c216-11e9-83de-f93931f6d489.gif)

This option has been introduced to simplify layouting during manual editing of the SVG string (without external SVG drawing tool).  Without this option determining the location of your shapes would require a lot of calculations or guessing ...

Remark: The location is measured in the SVG coordinate system, which means the origin (X=Y=0) is in the top left of your drawing.

### Auto format SVG Source after saving edits in SVG Editor
When editing the SVG source via [DrawSvg](#DrawSvg-drawing-editor), the manipulated SVG source isn't very pretty: the SVG source will contain emtpy lines, multiple SVG elements on a single line ...  This SVG source can be manually beautified using the "*Format SVG*" button, or automatically (every time the DrawSVG popup dialog window is closed - by activating this checkbox.

### Editor URL
This is the URL where the [DrawSvg](#DrawSvg-drawing-editor) editor instance is being hosted.  By default this field contains a link to the official [DrawSvg cloud](http://drawsvg.org/drawsvg.html) system, but it can also contain a link to a local DrawSvg installation (hosted via a [node-red-contrib-drawsvg](https://github.com/bartbutenaers/node-red-contrib-drawsvg) node).

*Be aware that this is a free system, so there is no garuantee about availability of the cloud system!*

### Directory
This directory of your local system (where your Node-RED instance is running) can be used to make your local images available, to both your dashboard and your flow editor.

### Pan and zoom
A series of options are available to allow panning and zooming, which is useful for large drawings (like buildings, process flows, ...):

+ ***"Panning"***: enable panning in X, Y or in both directions.
+ ***"Zooming"***:  enable zooming.
+ ***"Pan only when zoomed"***: when this option is activated, the SVG drawing can only be panned when it has been zoomed previously.  Indeed when the drawing is at its original size, it might in some cases be pointless to allow panning.
+ ***"Enable mouse-wheel zooming"***: allow zooming in/out by rotating the mouse wheel.
+ ***"Enable double click zooming"***: the behaviour of this option differs on a touch screen.
   + When a mouse is being used, every double click will trigger zooming in.  Or it will trigger zooming out, when the SHIFT key is being pressed meanwhile.
   + On a touch screen the first double tap will trigger zooming in.  The second double tap will trigger zooming out.  And so on ...

The following demo shows how to pan and zoom via the mouse (mousewheel and dragging):

![svg_panzoom_mouse](https://user-images.githubusercontent.com/14224149/85945109-cd7dbc80-b93b-11ea-8dde-86f32be2b89e.gif)

When a ***touch device*** has been detected, panning and zoom through touch events is also supported.  Thanks to [tkirchm](https://github.com/tkirchm) for getting us started with these new features!  The following hand gestures are currently supported:

![gestures](https://user-images.githubusercontent.com/14224149/71647175-f6a5f300-2cf2-11ea-9389-ae1ab84ec18c.png)

It is also possible to control panning and zooming via input messages, as explained in the section [Control via messages](#control-via-messages) below.
The following example flow shows how to control panning and zooming from the flow editor (using Inject nodes) and via the dashboard (using dashboard button widgets):

![Pan zoom flow](https://user-images.githubusercontent.com/14224149/85944980-e20d8500-b93a-11ea-8e9e-7226634de35d.png)

```
[{"id":"a289199.a1714e8","type":"debug","z":"4ae15451.7b2f5c","name":"Floorplan output","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","x":2140,"y":380,"wires":[]},{"id":"32dfda30.706666","type":"ui_svg_graphics","z":"4ae15451.7b2f5c","group":"8d1b9121.83b3c","order":1,"width":"14","height":"10","svgString":"<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:svg=\"http://www.w3.org/2000/svg\" width=\"600px\" height=\"500px\" preserveAspectRatio=\"xMidYMid meet\"><defs id=\"svgEditorDefs\"><polygon id=\"svgEditorShapeDefs\" style=\"fill:rosybrown;stroke:black;vector-effect:non-scaling-stroke;stroke-width:1px;\"/></defs><rect id=\"svgEditorBackground\" x=\"0\" y=\"0\" width=\"100%\" height=\"100%\" style=\"fill: none; stroke: none;\"/><circle id=\"e1_circle\" cx=\"100\" cy=\"100\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"94\" y=\"105\" id=\"e2_texte\">A</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"104\" y=\"98\" id=\"e3_texte\"/><circle id=\"e2_circle\" cx=\"200\" cy=\"100\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"193\" y=\"107\" id=\"e4_texte\">B</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"195\" y=\"97\" id=\"e5_texte\"/><circle id=\"e3_circle\" cx=\"100\" cy=\"200\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"93\" y=\"206\" id=\"e6_texte\">F</text><circle id=\"e4_circle\" cx=\"200\" cy=\"200\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><circle id=\"e5_circle\" cx=\"100\" cy=\"300\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><circle id=\"e6_circle\" cx=\"200\" cy=\"300\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><circle id=\"e7_circle\" cx=\"302\" cy=\"102\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"293\" y=\"109\" id=\"e7_texte\">C</text><circle id=\"e8_circle\" cx=\"402\" cy=\"102\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"397\" y=\"108\" id=\"e8_texte\">D</text><circle id=\"e9_circle\" cx=\"300\" cy=\"200\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"295\" y=\"208\" id=\"e9_texte\">H</text><circle id=\"e10_circle\" cx=\"400\" cy=\"200\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><circle id=\"e11_circle\" cx=\"300\" cy=\"300\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><circle id=\"e12_circle\" cx=\"402\" cy=\"302\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><circle id=\"e13_circle\" cx=\"100\" cy=\"400\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><circle id=\"e14_circle\" cx=\"200\" cy=\"400\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><circle id=\"e15_circle\" cx=\"300\" cy=\"400\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><circle id=\"e16_circle\" cx=\"400\" cy=\"400\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><circle id=\"e17_circle\" cx=\"500\" cy=\"100\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"493\" y=\"106\" id=\"e17_texte\">E</text><circle id=\"e18_circle\" cx=\"500\" cy=\"200\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><circle id=\"e19_circle\" cx=\"500\" cy=\"300\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><circle id=\"e20_circle\" cx=\"500\" cy=\"400\" style=\"fill:rosybrown;stroke:black;stroke-width:1px;\" r=\"25.8069758011\"/><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"93\" y=\"307\" id=\"e1_texte\">K</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"93\" y=\"406\" id=\"e10_texte\">P</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"191\" y=\"208\" id=\"e11_texte\">G</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"193\" y=\"307\" id=\"e12_texte\">L</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"193\" y=\"406\" id=\"e13_texte\">Q</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"494\" y=\"308\" id=\"e14_texte\">O</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"492\" y=\"406\" id=\"e15_texte\">T</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"493\" y=\"207\" id=\"e16_texte\">J</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"392\" y=\"207\" id=\"e18_texte\">I</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"396\" y=\"309\" id=\"e19_texte\">N</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"393\" y=\"407\" id=\"e20_texte\">S</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"293\" y=\"306\" id=\"e21_texte\">M</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"292\" y=\"407\" id=\"e22_texte\">R</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"82.55244445800781\" y=\"26.68446922302246\" id=\"e23_texte\">100</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"182.9540252685547\" y=\"27.42818832397461\" id=\"e24_texte\">200</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"285.5868225097656\" y=\"27.42818832397461\" id=\"e25_texte\">300</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"385.2447204589844\" y=\"26.684473037719727\" id=\"e26_texte\">400</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"484.1588134765625\" y=\"27.428176879882812\" id=\"e27_texte\">500</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"8.180865287780762\" y=\"106.26204681396484\" id=\"e28_texte\">100</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"8.92458724975586\" y=\"204.4324493408203\" id=\"e29_texte\">200</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"6.693431854248047\" y=\"306.3215026855469\" id=\"e30_texte\">300</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"9.668293952941895\" y=\"405.23565673828125\" id=\"e31_texte\">400</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"40.160640716552734\" y=\"25.197044372558594\" id=\"e32_texte\"/><path d=\"M4.848484684596244,-1.5151515315403765v-2l4,4l-4,4v-2h-4v-4Z\" style=\"fill:rosybrown; stroke:black; vector-effect:non-scaling-stroke;stroke-width:1px;\" id=\"e37_shape\" transform=\"matrix(3.06783 0 0 3.06783 50.9445 18.8755)\"/><path d=\"M3.000000026913421,2.5000000672835476h2l-4,4l-4,-4h1.9999999999999998v-4h4Z\" style=\"fill:rosybrown; stroke:black; vector-effect:non-scaling-stroke;stroke-width:1px;\" id=\"e38_shape\" transform=\"matrix(2.97486 0 0 2.97486 22.3115 63.1265)\"/><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"35.698360443115234\" y=\"28.171905517578125\" id=\"e39_texte\">X</text><text style=\"fill:black;font-family:Arial;font-size:20px;\" x=\"19.336605072021484\" y=\"54.94566345214844\" id=\"e40_texte\">Y</text></svg>","clickableShapes":[{"targetId":"#mycircle","action":"click","payload":"cam living clicked","payloadType":"str","topic":"camera_living"}],"smilAnimations":[],"bindings":[{"selector":"#e26_texte","bindSource":"payload.title","bindType":"text","attribute":""}],"showCoordinates":false,"autoFormatAfterEdit":false,"showBrowserErrors":false,"selectorAsElementId":false,"outputField":"","editorUrl":"https://drawsvg.org/drawsvg.html","directory":"","panning":"both","zooming":"enabled","panOnlyWhenZoomed":false,"doubleClickZoomEnabled":true,"mouseWheelZoomEnabled":true,"name":"","x":1940,"y":380,"wires":[["a289199.a1714e8"]]},{"id":"91163354.31b2f","type":"inject","z":"4ae15451.7b2f5c","name":"Zoom in","topic":"","payload":"{\"command\":\"zoom_in\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1480,"y":260,"wires":[["32dfda30.706666"]]},{"id":"8c7c165f.dee1a8","type":"inject","z":"4ae15451.7b2f5c","name":"Zoom out","topic":"","payload":"{\"command\":\"zoom_out\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1480,"y":300,"wires":[["32dfda30.706666"]]},{"id":"d984058a.02d818","type":"inject","z":"4ae15451.7b2f5c","name":"Zoom 200%","topic":"","payload":"{\"command\":\"zoom_by_percentage\",\"percentage\":200}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1490,"y":340,"wires":[["32dfda30.706666"]]},{"id":"62277e70.5c676","type":"inject","z":"4ae15451.7b2f5c","name":"Zoom point (x=300, y=300) 200%","topic":"","payload":"{\"command\":\"zoom_by_percentage\",\"percentage\":200,\"x\":300,\"y\":300}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1550,"y":380,"wires":[["32dfda30.706666"]]},{"id":"365d5483.fa174c","type":"inject","z":"4ae15451.7b2f5c","name":"Pan to point (x=200 / y= 100)","topic":"","payload":"{\"command\":\"pan_to_point\",\"x\":200,\"y\":100}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1540,"y":420,"wires":[["32dfda30.706666"]]},{"id":"4d1e70dd.f51f3","type":"inject","z":"4ae15451.7b2f5c","name":"Pan to direction (x=200, y= 100)","topic":"","payload":"{\"command\":\"pan_to_direction\",\"x\":200,\"y\":100}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1550,"y":460,"wires":[["32dfda30.706666"]]},{"id":"79ebf8c1.adadd8","type":"inject","z":"4ae15451.7b2f5c","name":"Reset","topic":"","payload":"{\"command\":\"reset_panzoom\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"showConfirmation":false,"confirmationLabel":"","x":1470,"y":220,"wires":[["32dfda30.706666"]]},{"id":"61be354.f7175cc","type":"ui_button","z":"4ae15451.7b2f5c","name":"Reset","group":"8d1b9121.83b3c","order":4,"width":"3","height":"1","passthru":false,"label":"Reset","tooltip":"","color":"","bgcolor":"","icon":"","payload":"{\"command\":\"reset_panzoom\"}","payloadType":"json","topic":"","x":1730,"y":140,"wires":[["32dfda30.706666"]]},{"id":"d43dfb27.a0f308","type":"ui_button","z":"4ae15451.7b2f5c","name":"Zoom in","group":"8d1b9121.83b3c","order":4,"width":"3","height":"1","passthru":false,"label":"Zoom in","tooltip":"","color":"","bgcolor":"","icon":"","payload":"{\"command\":\"zoom_in\"}","payloadType":"json","topic":"","x":1740,"y":180,"wires":[["32dfda30.706666"]]},{"id":"ef78f0f5.c44b3","type":"ui_button","z":"4ae15451.7b2f5c","name":"Zoom out","group":"8d1b9121.83b3c","order":4,"width":"3","height":"1","passthru":false,"label":"Zoom out","tooltip":"","color":"","bgcolor":"","icon":"","payload":"{\"command\":\"zoom_out\"}","payloadType":"json","topic":"","x":1740,"y":220,"wires":[["32dfda30.706666"]]},{"id":"8d1b9121.83b3c","type":"ui_group","z":"","name":"Pan/zoom test","tab":"5021fcf2.ee7ac4","order":1,"disp":true,"width":"14","collapse":false},{"id":"5021fcf2.ee7ac4","type":"ui_tab","z":"","name":"SVG","icon":"dashboard","disabled":false,"hidden":false}]
```
Which results in this dashboard behaviour:

![svg_panzoom_demo](https://user-images.githubusercontent.com/14224149/85945042-4b8d9380-b93b-11ea-9724-8ee04e3d442c.gif)

Notice the different behaviour between the two types of buttons in this flow:
+ The dashboard buttons will trigger a message that contains the ***socketid***:

   ![socketid](https://user-images.githubusercontent.com/14224149/85958547-925ca700-b996-11ea-911d-d60778d7a933.png)
   
   Based on that socketid, only that client - where the button has been pressed - will receive the pan/zoom command (which is exactly what we want).
   
+ The Inject node buttons will trigger a message that contains no socketid (since there is no specific dashboard client involved here), so ALL clients will receive the same pan/zoom command (which is most of the time not useful).

Caution: make sure the panning and zooming is enabled in the Settings tabsheet, otherwise it won't be possible to control panning and zooming via input messages!

## Control via messages
Most of the SVG information can be manipulated by sending input messages to this node.  
Supported commands include...

* update_text
* update_innerHTML
* update_attribute
* set_attribute
* update_style
* set_style

*Refer to the nodes built-in help for full details and examples.*

### Some general guidelines:
+ To define on which SVG element(s) the control message needs to be applied, the element needs to be identified via a [css selector](https://www.w3schools.com/cssref/css_selectors.asp).  This is a very powerful query mechanism that allows you to apply the control message to multiple SVG elements at once!  For example set all texts with class 'titleText' to value 'my title':
   ```
   "payload": {
        "command": "update_text",
        "selector": ".titleText", //standard dom selector '#' for id, '.' for class etc.
        "textContent": "my title"
    }
   ```
+ In the example below, a message contains a single command.  For example:
   ```
   "payload": {
       "selector": "#cam_living_room",
       "attributeName": "fill",
       "attributeValue": "orange"
   }
   ```
   But it is always possible to specify ***multiple commands*** (as an array) in a single control message.  For example:
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
   }
   "topic": "update_attribute"
   ```
+ In the example below, action can be specified in the ```msg.topic```:
   ```
   "payload": {
       "selector": "#cam_living_room",
       "attributeName": "fill",
       "attributeValue": "orange"
   }
   "topic": "update_attribute"
   ```
   But it is also possible to use ```msg.command``` instead:
   ```
   "payload": {
       "command": "update_attribute",
       "selector": "#cam_living_room",
       "attributeName": "fill",
       "attributeValue": "orange"
   }
   ```   
   ... This  gives the additional flexability of being able to perform many things at once for example...
   ```
   "payload": [  
     {
         "command": "update_text",
         "selector": "#faultMessage",
         "textContent": "Something when wrong"
     },
     {
         "command": "update_attribute",
         "selector": "#faultMessage",
         "attributeName": "fill",
         "attributeValue": "red"
     },
     {
         "command": "update_style",
         "selector": "#faultMessage",
         "attributeName": "rotate",
         "attributeValue": "transform(180deg)"
     },
     {
         "command": "trigger_animation",
         "selector": "#faultMessage_blink",
         "action": "start"
     }
   ```
+ In all examples below, the selector also can be part of the topic

### Example updating/setting element attribute values
The SVG elements have attributes, whose values can be specified in the SVG editor.  Any of these attribute values can be changed via an input message. 

For example the camera is visualized by a text, which has multiple attributes (x, y, fill ...):

```
<text id="camera_living" x="310" y="45" font-family="FontAwesome" fill="blue" stroke="black" ...>
```

Let's change the *'fill'* color and *'rotation'* attribute value via input messages:

![2019-09-22_15-21-49](https://user-images.githubusercontent.com/44235289/65389304-c1c9ed80-dd4c-11e9-83a7-d7f41e380da2.gif)

```
[{"id":"58c6781.3a15f88","type":"debug","z":"60ad596.8120ba8","name":"Floorplan output","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":1540,"y":480,"wires":[]},{"id":"1ad6b670.79c40a","type":"ui_svg_graphics","z":"60ad596.8120ba8","group":"ed035e71.d5fbc","order":1,"width":"14","height":"10","svgString":"<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n  <image width=\"889\" height=\"703\" id=\"background\" xlink:href=\"https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg\" />\n  <text id=\"banner\" x=\"10\" y=\"16\" fill=\"black\" stroke=\"black\" font-size=\"35\" text-anchor=\"left\" alignment-baseline=\"middle\" stroke-width=\"1\">This is the #banner</text>\n  <circle id=\"pir_living\" cx=\"310\" cy=\"45\" r=\"5\" stroke-width=\"0\" fill=\"#FF0000\" />\n  <text id=\"camera_living\" x=\"310\" y=\"45\" font-family=\"FontAwesome\" fill=\"grey\" stroke=\"black\" font-size=\"35\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\"></text>\n</svg> ","clickableShapes":[{"targetId":"#camera_living","action":"click","payload":"camera_living","payloadType":"str","topic":"camera_living"}],"smilAnimations":[],"bindings":[{"selector":"#banner","bindSource":"payload.title","bindType":"text","attribute":""},{"selector":"#camera_living","bindSource":"payload.position.x","bindType":"attr","attribute":"x"},{"selector":"#camera_living","bindSource":"payload.camera.colour","bindType":"attr","attribute":"fill"}],"showCoordinates":false,"autoFormatAfterEdit":false,"outputField":"","editorUrl":"http://drawsvg.org/drawsvg.html","directory":"","name":"","x":1340,"y":480,"wires":[["58c6781.3a15f88"]]},{"id":"fcf645c7.5c40b8","type":"inject","z":"60ad596.8120ba8","name":"databind","topic":"databind","payload":"{\"camera\":{\"colour\":\"yellow\"},\"position\":{\"x\":320},\"title\":\"databind strikes again\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":960,"y":620,"wires":[["1ad6b670.79c40a"]]},{"id":"7d10ff36.e3ee6","type":"inject","z":"60ad596.8120ba8","name":"databind","topic":"databind","payload":"{\"camera\":{\"colour\":\"green\"},\"position\":{\"x\":250},\"title\":\"New banner title by databind\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":960,"y":580,"wires":[["1ad6b670.79c40a"]]},{"id":"c5638689.459598","type":"inject","z":"60ad596.8120ba8","name":"Fill camera green + rotate 90","topic":"update_attribute","payload":"[{\"command\":\"update_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"fill\",\"attributeValue\":\"green\"},{\"command\":\"set_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"rotate\",\"attributeValue\":\"90\"}]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1020,"y":440,"wires":[["1ad6b670.79c40a"]]},{"id":"6dd97bab.e6e2b4","type":"inject","z":"60ad596.8120ba8","name":"Fill camera orange + rotate 180","topic":"update_attribute","payload":"[{\"command\":\"update_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"fill\",\"attributeValue\":\"orange\"},{\"command\":\"set_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"rotate\",\"attributeValue\":\"180\"}]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":1030,"y":480,"wires":[["1ad6b670.79c40a"]]},{"id":"6bdbfd87.56cdc4","type":"inject","z":"60ad596.8120ba8","name":"Fill camera icon blue","topic":"update_attribute","payload":"[{\"command\":\"update_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"fill\",\"attributeValue\":\"blue\"},{\"command\":\"set_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"rotate\",\"attributeValue\":\"0\"}]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":990,"y":400,"wires":[["1ad6b670.79c40a"]]},{"id":"ed035e71.d5fbc","type":"ui_group","z":"","name":"Floorplan test","tab":"28908a07.9094f6","disp":true,"width":"14","collapse":false},{"id":"28908a07.9094f6","type":"ui_tab","z":"","name":"SVG","icon":"dashboard","disabled":false,"hidden":false}]
```

The `payload` looks like this:

```
  [
      {
          "command": "update_attribute",
          "selector": "#camera_living",
          "attributeName": "fill",
          "attributeValue": "green"
      },
      {
          "command": "set_attribute",
          "selector": "#camera_living",
          "attributeName": "rotate",
          "attributeValue": "90"
      }
  ]
```

The input message should have following format:
+ ```msg.payload.command``` or the ```msg.topic``` should contain one of the following values:
   + ***update_attribute***: to update the value of an *existing* SVG element attribute. 
   + ***set_attribute***: identical to update_attribute, but now the attribute will be created if it doesn't exist yet in the SVG element.
+ ```msg.payload.selector``` should contain a query selector, e.g. #my_circle to find SVG element with id="my_circle" (see list of available [css selectors](https://www.w3schools.com/cssref/css_selectors.asp)).
+ ```msg.payload.attributeName``` should contain the name of attribute whose value needs to be changed.
+ ```msg.payload.attributeValue``` should contain the new value of the specified attribute.

### Updating/setting element style values
The SVG elements' style values can be added/changed/removed via an input message. They can be addressed in 2 ways...

Named style attribute change...
```
{ 
   "command": "update_style", 
   "selector": ".camera", 
   "attributeName": "fill", 
   "attributeValue": "purple" 
}
```
Style object attribute(s) change...
```
{ 
   "command": "update_style", 
   "selector": ".camera", 
   "style": { "fill": "blue", "transform": "rotate(5deg)" } 
}
```
Additionally both `update_style` / `set_style` also support removing any styles e.g. 
```
{
   "command":"update_style", 
   "selector":".camera", 
   "style":{"fill":"","transform":""}
}
```

### Set text content
There are 2 methods for updating text...

+ Topic Method
+ Command Method

The topic method reduces the complexity but is simplistic and can only change the selector to one value.

The Command method is similar to the `update_atttribute` and `set_atttribute` command methods. They can even be combined to permit an attribute change and text content change in the same command msg.

Example Topic Method...

```
 // send a msg with topic formatted as...   
 //  update_text|selector  
 // and the payload with the text to display
 var msg = {
    "topic": "update_text|#myRect > .faultMessage",
    "payload": "hello"
 }
 return msg;
 ```
Example Command Method - payload object...
```
"payload": [
  {
     "command": "update_text",
     "selector": "#myRect > .faultMessage",
     "textContent": "Hello from a command message"
  },
  {
     //another command
  }
]
```

### Start/stop animations
As stated above, the animations can be started/stopped via an input message.

![animationcontrol](https://user-images.githubusercontent.com/44235289/65391018-ccd84a00-dd5b-11e9-815f-fa62b0fe24e8.gif)

```
[{"id":"c997135f.8035f","type":"debug","z":"f939feb8.8dc6","name":"Floorplan output","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":520,"y":220,"wires":[]},{"id":"bb93fff5.927ba","type":"ui_svg_graphics","z":"f939feb8.8dc6","group":"997e40da.b5acc","order":1,"width":"14","height":"10","svgString":"<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n  <image width=\"889\" height=\"703\" id=\"background\" xlink:href=\"https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg\" />\n  <text id=\"banner\" x=\"10\" y=\"16\" fill=\"black\" stroke=\"black\" font-size=\"35\" text-anchor=\"left\" alignment-baseline=\"middle\" stroke-width=\"1\">This is the #banner</text>\n  <circle id=\"pir_living\" cx=\"310\" cy=\"45\" r=\"1\" stroke-width=\"1\" fill=\"#FF0000\" />\n  <text id=\"camera_living\" x=\"310\" y=\"45\" font-family=\"FontAwesome\" fill=\"grey\" stroke=\"black\" font-size=\"35\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\"></text>\n</svg> ","clickableShapes":[{"targetId":"#camera_living","action":"click","payload":"camera_living","payloadType":"str","topic":"camera_living"}],"smilAnimations":[{"id":"myAnimation","targetId":"pir_living","classValue":"all_animation","attributeName":"r","fromValue":"1","toValue":"30","trigger":"cust","duration":"500","durationUnit":"ms","repeatCount":"5","end":"restore","delay":"1","delayUnit":"s","custom":"camera_living.click; "},{"id":"textRotate","targetId":"banner","classValue":"all_animation","attributeName":"rotate","fromValue":"0","toValue":"360","trigger":"msg","duration":"750","durationUnit":"ms","repeatCount":"3","end":"restore","delay":"1","delayUnit":"s","custom":""}],"bindings":[{"selector":"#banner","bindSource":"payload.title","bindType":"text","attribute":""},{"selector":"#camera_living","bindSource":"payload.position.x","bindType":"attr","attribute":"x"},{"selector":"#camera_living","bindSource":"payload.camera.colour","bindType":"attr","attribute":"fill"}],"showCoordinates":false,"autoFormatAfterEdit":false,"outputField":"","editorUrl":"","directory":"","name":"","x":420,"y":180,"wires":[["c997135f.8035f"]]},{"id":"356e2a8f.a08fe6","type":"inject","z":"f939feb8.8dc6","name":"databind","topic":"databind","payload":"{\"camera\":{\"colour\":\"yellow\"},\"position\":{\"x\":320},\"title\":\"databind strikes again\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":240,"y":260,"wires":[["bb93fff5.927ba"]]},{"id":"4e2e2d82.5950e4","type":"inject","z":"f939feb8.8dc6","name":"databind","topic":"databind","payload":"{\"camera\":{\"colour\":\"green\"},\"position\":{\"x\":250},\"title\":\"New banner title by databind\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":240,"y":220,"wires":[["bb93fff5.927ba"]]},{"id":"97b80c2d.b5c35","type":"inject","z":"f939feb8.8dc6","name":"Fill camera green + rotate 90","topic":"update_attribute","payload":"[{\"command\":\"update_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"fill\",\"attributeValue\":\"green\"},{\"command\":\"set_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"rotate\",\"attributeValue\":\"90\"}]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":300,"y":360,"wires":[["bb93fff5.927ba"]]},{"id":"4be0130f.78b13c","type":"inject","z":"f939feb8.8dc6","name":"Fill camera orange + rotate 180","topic":"update_attribute","payload":"[{\"command\":\"update_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"fill\",\"attributeValue\":\"orange\"},{\"command\":\"set_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"rotate\",\"attributeValue\":\"180\"}]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":310,"y":400,"wires":[["bb93fff5.927ba"]]},{"id":"46128135.4fcdd","type":"inject","z":"f939feb8.8dc6","name":"Fill camera icon blue","topic":"update_attribute","payload":"[{\"command\":\"update_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"fill\",\"attributeValue\":\"blue\"},{\"command\":\"set_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"rotate\",\"attributeValue\":\"0\"}]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":270,"y":320,"wires":[["bb93fff5.927ba"]]},{"id":"735182fa.b0c50c","type":"inject","z":"f939feb8.8dc6","name":"Start animation","topic":"trigger_animation","payload":"[{\"command\":\"trigger_animation\",\"selector\":\".all_animation\",\"action\":\"start\"}]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":240,"y":60,"wires":[["bb93fff5.927ba"]]},{"id":"7b608d5b.d892a4","type":"inject","z":"f939feb8.8dc6","name":"Stop animation","topic":"","payload":"[{\"command\":\"trigger_animation\",\"selector\":\"#myAnimation\",\"action\":\"stop\"},{\"command\":\"trigger_animation\",\"selector\":\"#textRotate\",\"action\":\"stop\"}]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":240,"y":100,"wires":[["bb93fff5.927ba"]]},{"id":"997e40da.b5acc","type":"ui_group","z":"","name":"Floorplan test","tab":"95801a22.bd5f18","disp":true,"width":"14","collapse":false},{"id":"95801a22.bd5f18","type":"ui_tab","z":"","name":"SVG","icon":"dashboard","disabled":false,"hidden":false}]
```

Example messages to trigger animations:
```
"payload": {
    "selector": "#myAnimation",
    "action": "start"
}
"topic": "trigger_animation"
```

```
"payload": [
    {
        "command": "trigger_animation",
        "selector": "#myAnimation",
        "action": "start"
    },
    {
        "command": "trigger_animation",
        "elementId": "textRotate",
        "action": "start"
    }
]
```

The input message should have following format:
+ ```msg.payload.command``` or ```msg.topic``` should contain ***trigger_animation***.
+ ```msg.payload.selector``` should contain a query selector, e.g. #myAnimation to find SVG element with id="myAnimation" (see list of available [css selectors](https://www.w3schools.com/cssref/css_selectors.asp)).
+ ```msg.payload.action``` should contain ***start*** or ***stop***, depending on which action you want to perform on the animation.

While permanently clickable shapes are being enumerated in the config screen, it is also possible to make shapes (un)clickable via input messages.  Example content of the ```msg.payload``` to make 'circle_1' unclickable and 'circle_2' clickable:
```
[{
  command  : "remove_event",
  event    : "click",
  selector : "#circle_1"
},
{
  command  : "add_event",
  event    : "click",
  selector : "#circle_2", 
  payload  : "circle 2 has been clicked",
  topic    : "CIRCLE_CLICKED"
}]
```

## Various stuff

### Fontawesome icons
Fontawesome icons are used widely in Node-RED, and are in fact little SVG drawings on their own.  They are a very easy way e.g. to represent devices on a floorplan.  Such an icon can easily be added via DrawSvg, as demonstrated in this animation:

![icons via drawsvg](https://user-images.githubusercontent.com/14224149/66722326-17edf600-ee0c-11e9-94b9-225edcc12250.gif)

By specifying an identifier for the icon (like in the above animation), the icon can be updated afterwards via input messages (like any other SVG element).

When you want to enter your SVG source ***manually*** (without using DrawSvg), there is another mechanism provided:

1. Search the [Fontawesome](https://fontawesome.com/v4.7.0/icons/) website for an icon that fits your needs.  For example 'fa-video-camera'.

2. Create a text element (with font family *"FontAwesome"*) containing that icon name:
   ```
   <text id="camera_living" x="310" y="45" font-family="FontAwesome" fill="blue" stroke="black" font-size="35" text-anchor="middle" alignment-baseline="middle" stroke-width="1">fa-video-camera</text>
   ```
   
3. The result will be the fontawesome icon at the specified location:

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
   [{"id":"f369eb92.6c5558","type":"ui_svg_graphics","z":"553defb0.b99fb","group":"9ec8b304.368cc","order":0,"width":"15","height":"15","svgString":"<!--<svg height=\"100\" width=\"100\"></svg>-->\n\n<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <text id=\"my_text\" x=\"100\" y=\"50\" font-family=\"FontAwesome\" fill=\"blue\" stroke=\"black\" font-size=\"80\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\">fa-thermometer-empty</text>\n</svg>","clickableShapes":[{"targetId":"#camera_living","action":"click","payload":"#camera_living","payloadType":"str","topic":"#camera_living"},{"targetId":"#camera_balcony","action":"click","payload":"#camera_balcony","payloadType":"str","topic":"#camera_balcony"},{"targetId":"#camera_entry","action":"click","payload":"#camera_entry","payloadType":"str","topic":"#camera_entry"}],"smilAnimations":[],"bindings":[{"selector":"#camera_living","bindSource":"payload.attributeValue","bindType":"attr","attribute":"fill"},{"selector":"#camera_entry","bindSource":"payload.attribueValue","bindType":"attr","attribute":"fill"},{"selector":"#camera_balcony","bindSource":"payload.attributeVale","bindType":"attr","attribute":"fill"}],"showCoordinates":true,"autoFormatAfterEdit":false,"outputField":"anotherField","editorUrl":"","directory":"","name":"Home Floor Plan","x":1130,"y":520,"wires":[[]]},{"id":"866e2e46.ba033","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-three-quarters","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-three-quarters\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":820,"y":520,"wires":[["f369eb92.6c5558"]]},{"id":"68c4730b.af00bc","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-full ","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-full\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":790,"y":560,"wires":[["f369eb92.6c5558"]]},{"id":"46183ab5.42fd54","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-empty","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-empty\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":800,"y":400,"wires":[["f369eb92.6c5558"]]},{"id":"501c7f9a.08ac4","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-half ","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-half\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":790,"y":480,"wires":[["f369eb92.6c5558"]]},{"id":"d3ea2538.fa9458","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-quarter","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-quarter\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":800,"y":440,"wires":[["f369eb92.6c5558"]]},{"id":"9ec8b304.368cc","type":"ui_group","z":"","name":"Home Floor Plan","tab":"bb4f2a94.83b338","disp":true,"width":"15","collapse":false},{"id":"bb4f2a94.83b338","type":"ui_tab","z":"","name":"Home Floor Plan","icon":"dashboard","disabled":false,"hidden":false}]
   ```

### DrawSvg drawing editor
[DrawSvg](http://drawsvg.org/) is a free SVG drawing editor that will run entirely in your browser, so no installation required.  We have integrated DrawSVG into this node, to allow users to edit their SVG source via a nice drawing program.

***!!! DrawSvg is free software.  Note that DrawSvg and the online service is used as is without warranty of bugs !!!***

Steps to use DrawSvg:
1. Click the *"Drawing editor"* button in the "SVG source" tabsheet.
2. DrawSvg will be opened in a popup dialog window, and it will visualize the SVG source.
3. The SVG drawing can be edited, but the original SVG source in this node will remain unchanged!
4. You can intermediately save your changes to the SVG source in this node, using the *"Save"* button in the upper right corner of the popup dialog window.
5. As soon as the popup dialog window is being closed, a notification will appear.  There you can choose to ignore all changes (i.e. you don't need them anymore), or to save all the changes to the SVG source in this node.
6. The updated SVG source will appear in this node.

![svg_drawsvg](https://user-images.githubusercontent.com/14224149/65639275-14730600-dfe8-11e9-93be-423f358b9fb2.gif)

By default this node will use the free online DrawSvg service (see *"Editor URL"* in the "Settings" tabsheet).  However we have planned to provide a new Node-RED node in the near future, which will allow to host DrawSVG locally for offline systems.

### Display images
SVG offers an image element, that can be used to display an image inside an SVG drawing.  You have to specify at which path the image is available, but the image can be stored a different locations:
1. The easiest solution is an online image that is public available.  For example:
   ```
   <image xlink:href="https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg"\>
   ```
   You can also make local images online available in Node-RED, e.g. by using a httpIn/httpOut nodes based flow.  However the disadvantage of online images is that they are public available ...
   
2. Load a local image, via the file selection dialog in [DrawSvg](#DrawSvg-drawing-editor).  This way you can easily select a local image available on the machine where you are *viewing* your dashboard in a browser.  DrawSvg will convert the image to a base64 encoded string, which is being inserted into the SVG source.
   ```
   <image xlink:href="xlink:href="data:image/png;base64,base64_encoded_image_string_..."\>
   ```
   The advantage is that the image stays available (even when it is deleted from the file system), but the size of the Node-RED flow file size will increase drastically.
   
3. In the SVG Source tabsheet you can use a local image file, which needs to exist (in the directory specified on the 'Settings' tabsheet) on the system where your Node-RED instance is running:
   ```
   <image xlink:href="xlink:href="file://some_local_file_name"\>
   ```
   Since both DrawSvg and the Node-RED dashboard cannot access this local path, this node will automatically convert the image  to a base64 encoded url.  That way DrawSvg and the dasbhoard can both display the image, and in the flow file only the local path is being stored.  The disadvantage is that you have to enter the path manually in the SVG Source tabsheet.
   
4. In the next version of DrawSvg it should be possible to work with local files.  See [issue](https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/35).

## Troubleshooting
Some tips and tricks to solve known problems:

1. When all shapes of the original drawing have disappeared, and have received the same color as the dashboard theme:

   ![Dashboard color](https://user-images.githubusercontent.com/14224149/79540632-c2c7c100-8088-11ea-9ba7-6c5dd4f0a842.png)
   
   + Seems this is not the case with DrawSvg drawings, since DrawSvg sets the fill color as a ```style``` attribute (e.g. <element style="fill:red" ... />).  
   + But some third party editors use the ```fill``` attribute fill (e.g. <element fill="red" ... />), which seems to be overwritten by the dashboard theme color.  Until we find a solution, you will have to change this manually ...

2. The input messages are being validated (in the server side flow), and validation errors will be showed in the debug sidepanel.

3. Not all input can be validated on the server side flow, e.g. it is impossible to determine on the server whether a specified shape id exists in the dashboard (i.e. in your browser).  Such errors will be displayed in your browser console log (where the dashboard is running).  However since it is sometimes very difficult to investigate that log (e.g. on smartphones), it is also possible to transfer those errors to your Node-RED debug sidebar by activating the *"Show browser errors on the server"* checkbox (in the 'Settings' panel).

   Remark: when N drawings are visible at the moment (e.g. running in N dashboards simultaneously), then N duplicate messages will be displayed (where N can be 0 is no dashboards are open...).


