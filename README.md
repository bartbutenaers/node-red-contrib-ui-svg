# node-red-contrib-ui-svg
A Node-RED widget node to show interactive SVG (vector graphics) in the dashboard

Special thanks to [Stephen McLaughlin](https://github.com/Steve-Mcl), my partner in crime for this node!

And also lots of credits to Joseph Liard, the author of [DrawSvg](http://www.drawsvg.org/home-en.html#contact) for his assistance!

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install bartbutenaers/node-red-contrib-ui-svg
```

***!!!!! USE THE ABOVE COMMAND TO INSTALL IT DIRECTLY FROM GITHUB (NOT AVAILABLE ON NPM YET) !!!!***

***!!!!! ONLY USE IT FOR TESTING PURPOSES !!!!***

***!!!!! FOLLOW OUR [DISCUSSION](https://discourse.nodered.org/t/announce-node-red-contrib-ui-svg-feedback-request/14431) ON THE NODE-RED FORUM !!!!***

***!!!!! HAVE A LOOK AT THE ISSUES LIST (ABOVE), BEFORE REGISTERING A NEW ISSUE !!!!***

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

This node can be used to visualize all kind of graphical stuff in the Node-RED dashboard.  This can range from simple graphics (e.g. a round button, ...) to very complex graphics (floorplans, industrial processes, piping, wiring, ...).  But even those complex graphics will consist out of a number of simple graphical shapes.  For example a ***floorplan*** is in fact a simple image of your floor, and a series of other SVG elements (e.g. Fontawesome icons) drawn on top of that (background) image.

The node's config screen consists of a series of tabsheets:

### SVG source

![editor](https://user-images.githubusercontent.com/14224149/65357446-5faba400-dbf7-11e9-9824-886238dba228.png)

Enter you (XML-based) SVG graphics in this editor.  This can be done in different ways:
+ If you are a die-hard SVG fanatic, you can enter the SVG string manually in the *"SVG Source"* tabsheet.
+ If you prefer to use an SVG drawing editor, you can use the embedded DrawSvg editor (see further).
+ If you need very specific types of drawings, you can use a third party SVG editor to create your drawing (and simple paste the generated SVG string into this tabsheet).  Multiple (online) editors are free available, each with their own dedicated speciality:
   + [Floorplanner](http://floorplanner.com)
   + [Floorplancreator](https://floorplancreator.net/#pricing)
   + ...

However:
   + Be aware that those third-party SVG editors could create rather complex SVG strings, which are harder to understand when you want to change them manually afterwards.
   + Be aware that the browser has a lot of work to render all the SVG elements in the drawing!  To gain performance it is advised not to simply past the SVG string into the editor, but create an image from it.  For example in Floorplanner website, the SVG drawing can be saved as a JPEG/PNG image.  That image can be loaded into an SVG *'image'* element, like I have done in the example flows on this readme page ...
      
At the bottom of the "SVG source" tabsheet, a series of buttons are available:

![buttons](https://user-images.githubusercontent.com/14224149/65372066-55c38880-dc6b-11e9-9dda-cbfa885f0285.png)

+ *Expand source*: show the SVG source in full screen mode.
+ *Format SVG*: by formatting the SVG source, the source will be beatyfied.  This means the empty lines will be removed, each line will get a single SVG element, indents will be corrected ...
+ *Drawing editor*: show the SVG source in the [DrawSvg](http://drawsvg.org/) drawing editor as a popup dialog window.

### Animations

![animations](https://user-images.githubusercontent.com/14224149/65359120-d2b71980-dbfb-11e9-83ea-5bbc6e155673.png)

SVG allows users to animate element attributes over time.  For example you can make the radius of a circle grow in 3 seconds from 10 pixels to 40 pixels. 

Adding animations to your SVG graphics can be done in different ways:
+ Die-hard SVG fanatics can add the animation in the *'SVG source'* manually:
   ```
   <circle id="mycircle" ... r="5" ...>
      <animate id="myanimation" attributeName="r" begin="0s" dur="3s" repeatCount="1" from="10" to="40"/>
   </circle>
   ```
   The animation will be applied by the browser to the parent element.
   However it is also possible to add an animation element with a link to the SVG element it needs to be applied to:
   ```
   <circle id="mycircle" ... r="5" .../>
   <animate xlink:href="#mycircle" id="myanimation" attributeName="r" begin="0s" dur="3s" repeatCount="1" from="10" to="40"/>
   ```

+ But to keep the drawing and the animations separated, the animations can also be added via the node's config screen.  Click the *'add'* button to create a new animation record, where following properties need to be entered:
   + ***Animation id***: The id of this SVG animate element (in this example *"myanimation"*).
   + ***Target element id***: The id of the SVG element that you want to animate (in this example *"mycircle"*).
   + ***Class***: TODO Should this be removed (and replaced by selector) ????????????
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

### Events

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
+ ***Selector***: the selection of SVG elements that needs to intercept events. TODO format examples
+ ***Action***: the event that the shape needs to intercept.
+ ***Payload***: the ```msg.payload``` content of the output message.
+ ***Topic***: the ```msg.topic``` content of the output message.

By default the content will be stored in ```msg.payload```.  However when the result needs to end up in ```msg.anotherField```, this message field can be specfied at the top of the tabsheet:

![image](https://user-images.githubusercontent.com/14224149/65385332-dd71cb80-dd2d-11e9-8ae9-7b604d3f077e.png)

Two things will happen when an event occurs on such an SVG element:
1. The mouse ***cursor*** will change when hoovering above the element, to visualize that an element responds to events.
1. An ***output message*** will be send as soon as the element is clicked:
   ```
   "coordinates": {
      x: 195.3749237060547,
      y: 201.20571899414062
   }
   "elementId": "circle"
   "event": "click"
   "payload": {
      elementId: "cam3spin",
      status: "start"
   }
   "position": {x: 854, y: 284}
   "selector": undefined
   "topic": "circle"
   ```
   Note that the coordinates (where the event occurs) are also available in the output message.  This allows the next nodes in the flow to display information at that location.  For example we have developed the [node-red-contrib-ui-contextmenu](https://github.com/bartbutenaers/node-red-contrib-ui-contextmenu) to show a popup context menu in the dashboard above the SVG drawing, at the location where a shape has been clicked.


*Demo...*

![2019-09-22_14-12-06](https://user-images.githubusercontent.com/44235289/65387884-149ea780-dd43-11e9-9cd4-a6bb4fb59d65.gif)

*Demo Flow...*

```
[{"id":"b93a4d6b.cee94","type":"debug","z":"f939feb8.8dc6","name":"Floorplan output","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":330,"y":280,"wires":[]},{"id":"180fb86a.53e2e8","type":"ui_svg_graphics","z":"f939feb8.8dc6","group":"997e40da.b5acc","order":1,"width":"14","height":"10","svgString":"<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n  <image width=\"889\" height=\"703\" id=\"background\" xlink:href=\"https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg\"/>\n  <circle id=\"pir_living\" cx=\"310\" cy=\"45\" r=\"5\" stroke-width=\"0\" fill=\"#FF0000\"/>\n  <text id=\"camera_living\" x=\"310\" y=\"45\" font-family=\"FontAwesome\" fill=\"blue\" stroke=\"black\" font-size=\"35\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\"></text>\n</svg>","clickableShapes":[{"targetId":"#camera_living","action":"click","payload":"camera_living","payloadType":"str","topic":"camera_living"}],"smilAnimations":[],"bindings":[],"showCoordinates":false,"autoFormatAfterEdit":false,"outputField":"","editorUrl":"","directory":"","name":"","x":130,"y":280,"wires":[["b93a4d6b.cee94"]]},{"id":"997e40da.b5acc","type":"ui_group","z":"","name":"Floorplan test","tab":"95801a22.bd5f18","disp":true,"width":"14","collapse":false},{"id":"95801a22.bd5f18","type":"ui_tab","z":"","name":"SVG","icon":"dashboard","disabled":false,"hidden":false}]
```  


*Config...*

![image](https://user-images.githubusercontent.com/44235289/65388020-54fe2580-dd43-11e9-8194-82304b2e7461.png)


### Input bind
As explained in the section "Control via messages" (TODO link), this node can be controlled via input messages.  For example to change the fill color of circle with id "mycircle" to green.  However this means that a lot of information needs to be passed via that input message (element id, attribute name, attribute value ...), to let this node know what you want it to do.  As a result the flow might become quite complex, since you need extra nodes to put all that information in the message.

Another way to control this node is by using bindings, which means we specify most of the information in the binding (so the input message will only need to contain the new value).  This means that the flow itself can be kept very simple ... 

![bindings](https://user-images.githubusercontent.com/14224149/65362302-2bd87a80-dc07-11e9-9409-76fe1a205abc.png)

Input bindings can be added to link sources (= input message fields) to destinations (= element attribute/text values).   

A number of properties need to be entered:
+ ***Binding source***: the field of the input message that will contain the new value.
+ ***Selector***: on which SVG elements the new values will be applied.  If no elements can be found, nothing will happen.
+ ***Binding destination***: on which part of the SVG elements the new values will be applied.
   + *Attribute value*: when this option is selected, the value (from the input message) will be applied to an attribute.  This means an extra "attribute name" will have to be specified, to make sure the new value will be applied to the attribute with that name.
   + *Text content*: when this option is selected, the value (from the input message) will be be applied to the inner text content of the element.
   
*Demo...*

![2019-09-22_14-58-05](https://user-images.githubusercontent.com/44235289/65389024-7b26c400-dd49-11e9-9792-94c6216e53ef.gif)

*Demo flow...*

```
[{"id":"c997135f.8035f","type":"debug","z":"f939feb8.8dc6","name":"Floorplan output","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":400,"y":120,"wires":[]},{"id":"bb93fff5.927ba","type":"ui_svg_graphics","z":"f939feb8.8dc6","group":"997e40da.b5acc","order":1,"width":"14","height":"10","svgString":"<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n  <image width=\"889\" height=\"703\" id=\"background\" xlink:href=\"https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg\" />\n  <text id=\"banner\" x=\"10\" y=\"16\" fill=\"black\" stroke=\"black\" font-size=\"35\" text-anchor=\"left\" alignment-baseline=\"middle\" stroke-width=\"1\">This is the #banner</text>\n  <circle id=\"pir_living\" cx=\"310\" cy=\"45\" r=\"5\" stroke-width=\"0\" fill=\"#FF0000\" />\n  <text id=\"camera_living\" x=\"310\" y=\"45\" font-family=\"FontAwesome\" fill=\"grey\" stroke=\"black\" font-size=\"35\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\"></text>\n</svg> ","clickableShapes":[{"targetId":"#camera_living","action":"click","payload":"camera_living","payloadType":"str","topic":"camera_living"}],"smilAnimations":[],"bindings":[{"selector":"#banner","bindSource":"payload.title","bindType":"text","attribute":""},{"selector":"#camera_living","bindSource":"payload.position.x","bindType":"attr","attribute":"x"},{"selector":"#camera_living","bindSource":"payload.camera.colour","bindType":"attr","attribute":"fill"}],"showCoordinates":false,"autoFormatAfterEdit":false,"outputField":"","editorUrl":"","directory":"","name":"","x":320,"y":80,"wires":[["c997135f.8035f"]]},{"id":"356e2a8f.a08fe6","type":"inject","z":"f939feb8.8dc6","name":"databind","topic":"databind","payload":"{\"camera\":{\"colour\":\"yellow\"},\"position\":{\"x\":320},\"title\":\"databind strikes again\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":100,"wires":[["bb93fff5.927ba"]]},{"id":"4e2e2d82.5950e4","type":"inject","z":"f939feb8.8dc6","name":"databind","topic":"databind","payload":"{\"camera\":{\"colour\":\"green\"},\"position\":{\"x\":250},\"title\":\"New banner title by databind\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":60,"wires":[["bb93fff5.927ba"]]},{"id":"997e40da.b5acc","type":"ui_group","z":"","name":"Floorplan test","tab":"95801a22.bd5f18","disp":true,"width":"14","collapse":false},{"id":"95801a22.bd5f18","type":"ui_tab","z":"","name":"SVG","icon":"dashboard","disabled":false,"hidden":false}]
```

*Demo Setup...*

![image](https://user-images.githubusercontent.com/44235289/65389078-ef616780-dd49-11e9-91c0-45731ef17509.png)

*Demo message...*

```
  "topic": "databind",
  "payload": {
    "camera": {
      "colour": "green"
    },
    "position": {
      "x": 250
    },
    "title": "New banner title by databind"
  }

```

## Control via messages
Most of the SVG information can be manipulated by sending input messages to this node.  

Some general guidelines:
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
           "elementId": "camera_living",
           "selector": "#cam_living",
           "attributeName": "fill",
           "attributeValue": "orange"
        },
        {
           "elementId": "camera_kitchen",
           "selector": "#cam_kitchen",
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
         "command": "trigger_animation",
         "selector": "#faultMessage_blink",
         "action": "start"
     }
   ```
+ In all examples below, the selector also can be part of the topic

### Updating/setting element attribute values
The SVG elements have attributes, whose values can be specified in the SVG editor.  Any of these attribute values can be changed via an input message. 

For example the camera is visualized by a text, which has multiple attributes (x, y, fill ...):

```
<text id="camera_living" x="310" y="45" font-family="FontAwesome" fill="blue" stroke="black" ...>
```

Let's change the *'fill'* color and *'rotation'* attribute value via input messages:

![2019-09-22_15-21-49](https://user-images.githubusercontent.com/44235289/65389304-c1c9ed80-dd4c-11e9-83a7-d7f41e380da2.gif)

```
[{"id":"c997135f.8035f","type":"debug","z":"f939feb8.8dc6","name":"Floorplan output","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":400,"y":360,"wires":[]},{"id":"bb93fff5.927ba","type":"ui_svg_graphics","z":"f939feb8.8dc6","group":"997e40da.b5acc","order":1,"width":"14","height":"10","svgString":"<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n  <image width=\"889\" height=\"703\" id=\"background\" xlink:href=\"https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg\" />\n  <text id=\"banner\" x=\"10\" y=\"16\" fill=\"black\" stroke=\"black\" font-size=\"35\" text-anchor=\"left\" alignment-baseline=\"middle\" stroke-width=\"1\">This is the #banner</text>\n  <circle id=\"pir_living\" cx=\"310\" cy=\"45\" r=\"5\" stroke-width=\"0\" fill=\"#FF0000\" />\n  <text id=\"camera_living\" x=\"310\" y=\"45\" font-family=\"FontAwesome\" fill=\"grey\" stroke=\"black\" font-size=\"35\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\"></text>\n</svg> ","clickableShapes":[{"targetId":"#camera_living","action":"click","payload":"camera_living","payloadType":"str","topic":"camera_living"}],"smilAnimations":[],"bindings":[{"selector":"#banner","bindSource":"payload.title","bindType":"text","attribute":""},{"selector":"#camera_living","bindSource":"payload.position.x","bindType":"attr","attribute":"x"},{"selector":"#camera_living","bindSource":"payload.camera.colour","bindType":"attr","attribute":"fill"}],"showCoordinates":false,"autoFormatAfterEdit":false,"outputField":"","editorUrl":"","directory":"","name":"","x":300,"y":320,"wires":[["c997135f.8035f"]]},{"id":"356e2a8f.a08fe6","type":"inject","z":"f939feb8.8dc6","name":"databind","topic":"databind","payload":"{\"camera\":{\"colour\":\"yellow\"},\"position\":{\"x\":320},\"title\":\"databind strikes again\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":400,"wires":[["bb93fff5.927ba"]]},{"id":"4e2e2d82.5950e4","type":"inject","z":"f939feb8.8dc6","name":"databind","topic":"databind","payload":"{\"camera\":{\"colour\":\"green\"},\"position\":{\"x\":250},\"title\":\"New banner title by databind\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":120,"y":360,"wires":[["bb93fff5.927ba"]]},{"id":"97b80c2d.b5c35","type":"inject","z":"f939feb8.8dc6","name":"Fill camera green + rotate 90","topic":"update_attribute","payload":"[{\"command\":\"update_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"fill\",\"attributeValue\":\"green\"},{\"command\":\"set_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"rotate\",\"attributeValue\":\"90\"}]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":180,"y":220,"wires":[["bb93fff5.927ba"]]},{"id":"4be0130f.78b13c","type":"inject","z":"f939feb8.8dc6","name":"Fill camera orange + rotate 180","topic":"update_attribute","payload":"[{\"command\":\"update_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"fill\",\"attributeValue\":\"orange\"},{\"command\":\"set_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"rotate\",\"attributeValue\":\"180\"}]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":190,"y":260,"wires":[["bb93fff5.927ba"]]},{"id":"46128135.4fcdd","type":"inject","z":"f939feb8.8dc6","name":"Fill camera icon blue","topic":"update_attribute","payload":"[{\"command\":\"update_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"fill\",\"attributeValue\":\"blue\"},{\"command\":\"set_attribute\",\"selector\":\"#camera_living\",\"attributeName\":\"rotate\",\"attributeValue\":\"0\"}]","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":150,"y":180,"wires":[["bb93fff5.927ba"]]},{"id":"997e40da.b5acc","type":"ui_group","z":"","name":"Floorplan test","tab":"95801a22.bd5f18","disp":true,"width":"14","collapse":false},{"id":"95801a22.bd5f18","type":"ui_tab","z":"","name":"SVG","icon":"dashboard","disabled":false,"hidden":false}]
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


### Set text content
There are 2 methods for updating text...

+ Topic Method
+ Command Method

The topic method reduces the complexity but is simplistic and can only change the selector to one value.

The Command method is similar to the `update_atttribute` and `set_atttribute` command methods. They can even be combined to permit an attribute change and text content change in the same command msg.

Example Topic Method...

 // send a msg with topic formatted as...   
 //  update_text|selector  
 // and the payload with the text to display
 ```
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



## Settings

### Show coordinates
When this option is selected, a ***tooltip*** will be displayed to show the current mouse location (i.e. X and Y coordinate):

![svg_tooltip_coordinates](https://user-images.githubusercontent.com/14224149/63231067-79cc1e00-c216-11e9-83de-f93931f6d489.gif)

This option has been introduced to simplify layouting during manual editing of the SVG string (without external SVG drawing tool).  Without this option determining the location of your shapes would require a lot of calculations or guessing ...

Remark: The location is measured in the SVG coordinate system, which means the origin (X=Y=0) is in the top left of your drawing.

### Auto format SVG Source after saving edits in SVG Editor
When editing the SVG source via DrawSvg, the manipulated SVG source isn't very pretty: the SVG source will contain emtpy lines, multiple SVG elements on a single line ...  This SVG source can be manually beautified using the "*Format SVG*" button, or automatically (every time the DrawSVG popup dialog window is closed - by activating this checkbox.

### Editor URL
This is the URL where the DrawSvg editor instance is being hosted.  By default this field contains a link to the official [DrawSvg cloud](http://drawsvg.org/drawsvg.html) system.  *Be aware that this is a free system, so there is no garuantee about availability of the system!*

### Directory
This directory of your local system (where your Node-RED instance is running) can be used to make your local images available, to both your dashboard and your flow editor.

## Various stuff

### Fontawesome icons
Fontawesome icons are used widely in Node-RED, and are in fact little SVG drawings on their own.  They are a very easy way e.g. to represent devices on a floorplan.  Such an icon can easily be added to your SVG drawing, by following these steps:

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
+ Currently DrawSvg doesn't support the FontAwesome font.  See this [issue](https://github.com/bartbutenaers/node-red-contrib-ui-svg/issues/34).

+ Since FontAwesome icons are displayed in ```<text>``` SVG elements, it is very easy to change the icon using a ***update_text*** (see 'Control messages' section above):

   ![svg_dynamic_icon](https://user-images.githubusercontent.com/14224149/65432498-95c96d80-de1b-11e9-86c1-8ee7aa147d15.gif)

   ```
   [{"id":"f369eb92.6c5558","type":"ui_svg_graphics","z":"553defb0.b99fb","group":"9ec8b304.368cc","order":0,"width":"15","height":"15","svgString":"<!--<svg height=\"100\" width=\"100\"></svg>-->\n\n<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <text id=\"my_text\" x=\"100\" y=\"50\" font-family=\"FontAwesome\" fill=\"blue\" stroke=\"black\" font-size=\"80\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\">fa-thermometer-empty</text>\n</svg>","clickableShapes":[{"targetId":"#camera_living","action":"click","payload":"#camera_living","payloadType":"str","topic":"#camera_living"},{"targetId":"#camera_balcony","action":"click","payload":"#camera_balcony","payloadType":"str","topic":"#camera_balcony"},{"targetId":"#camera_entry","action":"click","payload":"#camera_entry","payloadType":"str","topic":"#camera_entry"}],"smilAnimations":[],"bindings":[{"selector":"#camera_living","bindSource":"payload.attributeValue","bindType":"attr","attribute":"fill"},{"selector":"#camera_entry","bindSource":"payload.attribueValue","bindType":"attr","attribute":"fill"},{"selector":"#camera_balcony","bindSource":"payload.attributeVale","bindType":"attr","attribute":"fill"}],"showCoordinates":true,"autoFormatAfterEdit":false,"outputField":"anotherField","editorUrl":"","directory":"","name":"Home Floor Plan","x":1130,"y":520,"wires":[[]]},{"id":"866e2e46.ba033","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-three-quarters","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-three-quarters\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":820,"y":520,"wires":[["f369eb92.6c5558"]]},{"id":"68c4730b.af00bc","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-full ","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-full\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":790,"y":560,"wires":[["f369eb92.6c5558"]]},{"id":"46183ab5.42fd54","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-empty","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-empty\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":800,"y":400,"wires":[["f369eb92.6c5558"]]},{"id":"501c7f9a.08ac4","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-half ","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-half\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":790,"y":480,"wires":[["f369eb92.6c5558"]]},{"id":"d3ea2538.fa9458","type":"inject","z":"553defb0.b99fb","name":"fa-thermometer-quarter","topic":"","payload":"{\"command\":\"update_text\",\"selector\":\"#my_text\",\"textContent\":\"fa-thermometer-quarter\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":800,"y":440,"wires":[["f369eb92.6c5558"]]},{"id":"9ec8b304.368cc","type":"ui_group","z":"","name":"Home Floor Plan","tab":"bb4f2a94.83b338","disp":true,"width":"15","collapse":false},{"id":"bb4f2a94.83b338","type":"ui_tab","z":"","name":"Home Floor Plan","icon":"dashboard","disabled":false,"hidden":false}]
   ```

### DrawSvg drawing editor
[DrawSvg](http://drawsvg.org/) is a free SVG drawing editor that will run entirely in your browser, so no installation required.  We have integrated DrawSVG into this node, to allow users to edit their SVG source via a nice drawing program.

***!!! Note that DrawSvg and the online service is used as is without warranty of bugs !!!***

Steps to use DrawSvg:
1. Click the *"Drawing editor"* button in the "SVG source" tabsheet.
2. DrawSvg will be opened in a popup dialog window, and it will visualize the SVG source.
3. The SVG drawing can be edited, but the original SVG source in this node will remain unchanged!
4. You can intermediately save your changes to the SVG source in this node, using the *"Save"* button in the upper right corner of the popup dialog window.
5. As soon as the popup dialog window is being closed, a notification will appear.  There you can choose to ignore all changes (i.e. you don't need them anymore), or to save all the changes to the SVG source in this node.
6. The updated SVG source will appear in this node.

By default this node will use the free online DrawSvg service (see *"Editor URL"* in the "Settings" tabsheet).  However we have planned to provide a new Node-RED node in the near future, which will allow to host DrawSVG locally for offline systems.

### Display images
SVG offers an image element, that can be used to display an image inside an SVG drawing.  You have to specify at which path the image is available, but the image can be stored a different locations:
1. The easiest solution is an online image that is public available.  For example:
   ```
   <image xlink:href="https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg"\>
   ```
   You can also make local images online available in Node-RED, e.g. by using a httpIn/httpOut nodes based flow.  However the disadvantage of online images is that they are public available ...
   
2. Load a local image, via the file selection dialog in DrawSvg.  This way you can easily select a local image available on the machine where you are *viewing* your dashboard in a browser.  DrawSvg will convert the image to a base64 encoded string, which is being inserted into the SVG source.
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
