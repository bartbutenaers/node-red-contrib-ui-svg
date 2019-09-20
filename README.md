# node-red-contrib-ui-svg
A Node-RED widget node to show interactive SVG (vector graphics) in the dashboard

Special thanks to [Stephen McLaughlin](https://github.com/Steve-Mcl), my partner in crime for this node!  And also lots of credits to Joseph Liard, the author of [DrawSvg](http://www.drawsvg.org/home-en.html#contact) for all his assistance!

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
Scalable Vector Graphics (SVG) is an XML-based vector image format for two-dimensional graphics with support for interactivity and animation. I'm not going to explain here how it works, because the internet is full of information about it.  If you are not familiar with SVG, I advise you to start reading some tutorials before starting with this node!

An SVG drawing contains a series of SVG elements, which will be rendered by the browser from top to bottom.  For example:
```
<svg ...>
  <image .../>
  <circle .../>
  <text .../>
</svg>
```
The browser will first draw the (background) image, then the circle (on top of the image), and so on ...

The node can be used to visualize all kind of things: floorplans, industrial processes, piping, wiring, ...
A floorplan is in fact a simple image of your floor, and a series of other SVG elements (e.g. Fontawesome icons) drawn on top of that (background) image.

## Node usage

The node's config screen consists of a series of tabsheets:

### SVG source

![editor](https://user-images.githubusercontent.com/14224149/65357446-5faba400-dbf7-11e9-9824-886238dba228.png)

Enter you (XML-based) SVG graphics in this editor.  This can be done in two ways:
+ If you are a die-hard SVG fanatic, you can enter the SVG string manually in the *"SVG Source"* tabsheet.
+ If you prefer to use an SVG editor, you can use the embedded DrawSvg editor (see further).
+ If you need very specific types of drawings, you can use a third party SVG editor to create your drawing.  Multiple (online) editors are free available, each with their own dedicated speciality:
   + [Floorplanner](http://floorplanner.com)
   + [Floorplancreator](https://floorplancreator.net/#pricing)
   + ...
   Once you are finished, the generated SVG can be pasted into the 'SVG source' tabsheet.  However:
      + Be aware that those third-party SVG editors will create rather complex SVG strings, which are harder to understand when you want to change them manually afterwards.
      + Be aware that the browser has a lot of work to render all the SVG elements in the drawing!  To gain performance it is advised not to simply past the SVG string into the editor, but create an image from it.  For example in Floorplanner website, the SVG drawing can be saved as a JPEG/PNG image.  That image can be loaded into an SVG *'image'* element, like I have done in the example flows on this readme page ...

### Animations

![animations](https://user-images.githubusercontent.com/14224149/65359120-d2b71980-dbfb-11e9-83ea-5bbc6e155673.png)

SVG allows users to animate element properties over time.  For example you can make the radius of a circle grow in 3 seconds from 10 pixels to 40 pixels. 

Adding animations to your SVG graphics can be done in two ways:
+ If you prefer, you can add the animation in the *'SVG source'* manually:
   ```
   <circle id="mycircle" ... r="5" ...>
      <animate id="myanimation" attributeName="r" begin="0s" dur="3s" repeatCount="1" from="10" to="40"/>
   </circle>
   ```

+ If you like to use this node's config screen, you can click the *'add'* button to create a new animation record.  A number of properties need to be entered:
   + ***Animation id***: The id of this SVG animate element (in this example *"myanimation"*).
   + ***Target element id***: The id of the SVG element that you want to animate (in this example *"mycircle"*).
   + ***Class***: TODO Should this be removed (and replaced by selector) ????????????
   + ***Attribute name***: The name of the element's attribute that you want to animate (in this example *"r"*).
   + ***From***: The attribute value at the start of the animation (in this example *"10"*).
   + ***To***: The attribute value at the end of the animation (in this example *"40"*).
   + ***Duration***: How long the animation will take.
   + ***Repeat count***: How many times the animation needs to be repeated (in this example *"1" which means only once).  Caution: when *"0"* is selected, this means that the animation will be repeated ***"indefinite"***!
   + ***Animation end***: What to do with the new value when the animation is ended.
      + Freeze new value: the attribute value will keep the new *'To'* value (in this example *"40"*).  
      + Restore original value: the attribute value will be restored to its original value (in this example *"5"*), from the start of the animation.
   + ***Trigger***: Which trigger will result in the animation being started.
      + Input message: TODO.
      + Time delay: TODO
      + Custom: TODO
   
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
+ *Focus': when an element receives focus.
+ *Focus in*: when an element is about to receive focus.
+ *Focus out*: when an element is about to lose focus.
+ *Blur*: when an element loses focus.
+ *Key down*: when a key is pressed down.
+ *Key up*: when a key is released.
+ *Touch start*: when a touch event starts (on mobile/tablet only).
+ *Touch end*: when a touch event ends (on mobile/tablet only).

Two things will occur for an event that responds to events:
1. The mouse ***cursor*** will change when hoovering above the element, to visualize that an element responds to events.
1. An ***output message*** will be send as soon as the element is clicked:

   ![svg_click_cam](https://user-images.githubusercontent.com/14224149/63216845-b4ad5380-c13b-11e9-8aaf-c63b29a194ca.gif)

   ```
   [{"id":"f3883602.216b58","type":"debug","z":"60ad596.8120ba8","name":"Floorplan output","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":920,"y":220,"wires":[]},{"id":"1fb8c46e.6bfb5c","type":"ui_svg_graphics","z":"60ad596.8120ba8","group":"ba24f321.07795","order":1,"width":"14","height":"10","svgString":"<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n  <image width=\"889\" height=\"703\" id=\"background\" xlink:href=\"https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg\"/>\n  <circle id=\"pir_living\" cx=\"310\" cy=\"45\" r=\"5\" stroke-width=\"0\" fill=\"#FF0000\"/>\n  <text id=\"camera_living\" x=\"310\" y=\"45\" font-family=\"FontAwesome\" fill=\"blue\" stroke=\"black\" font-size=\"35\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\"></text>\n</svg>","clickableShapes":[{"targetId":"camera_living"}],"smilAnimations":[],"name":"","x":720,"y":220,"wires":[["f3883602.216b58"]]},{"id":"ba24f321.07795","type":"ui_group","z":"","name":"Floorplan test","tab":"fb3be807.e7ef18","disp":true,"width":"14","collapse":false},{"id":"fb3be807.e7ef18","type":"ui_tab","z":"","name":"SVG","icon":"dashboard","disabled":false,"hidden":false}]
   ```

A number of properties need to be entered:
+ ***Selector***: the selection of SVG elements that needs to intercept events. TODO format examples
+ ***Action***: the event that the shape needs to intercept.
+ ***Payload***: the ```msg.payload``` content of the output message.
+ ***Topic***: the ```msg.topic``` content of the output message.

### Input bindings

![bindings](https://user-images.githubusercontent.com/14224149/65362302-2bd87a80-dc07-11e9-9409-76fe1a205abc.png)

Input bindings can be added to link sources (i.e. input message fields) to destinations (i.e. element attribute/text values).  This way the input message can be kept very simple, since it only needs to contain the value itself.  Which means that the flow itself can be kept very simple ...  Only make sure that the ```msg.payload.topic``` of the input message contains "***databind***".

A number of properties need to be entered:
+ ***Binding source***: the field of the input message that will contain the new value.
+ ***Selector***: one or more SVG elements on which those new values will be applied.  If no elements can be found, nothing will happen.
+ ***Binding destionation***: on which part of the SVG elements the applied.
   + Attribute value: when this option is selected, an extra "attribute name" will have to be specified, since the new value has to be applied to that attribute.
   + Text content: when this option is selected, a custom text content can be specified for an SVG ```<text>``` element (which is not an attribute).
   
For example to apply orange as fill color value for the first binding:
```
"payload": {
    "attributeValue": "orange"
}
"topic": "databind"
```

## Control via messages
Most of the SVG information can be controlled by sending input messages to this node.  The ```msg.payload.command``` or the ```msg.payload.topic``` should have one of the following values:

+ ***update_text***: To update the text of an SVG ```<text>``` element to the value specified in ```msg.payload.textContent```.
+ ***update_attribute***: to update the value of an *existing* SVG element attribute.  The attribute name needs to be specified in ```msg.payload.attributeName``` and the value in ```msg.payload.attributeValue```
+ ***set_attribute***: identical to update_attribute, but now the attribute will be created if it doesn't exist yet in the SVG element.
+ ***trigger_animation***: via ```msg.payload.action``` a "start" or "stop" action needs to specified.

### Updating element attribute values
The SVG elements have attributes, whose values can be specified in the SVG editor.  Any of these attribute values can be changed via an input message. 

For example the camera is visualized by a text, which has multiple attributes (x, y, fill ...):
```
<text id="camera_living" x="310" y="45" font-family="FontAwesome" fill="blue" stroke="black" ...>
```

Let's change the *'fill'* color attribute value via input messages:

![svg_update_fill](https://user-images.githubusercontent.com/14224149/63216938-d14a8b00-c13d-11e9-8592-d112117bd1ac.gif)

```
[{"id":"ad76788b.158348","type":"inject","z":"60ad596.8120ba8","name":"Fill camera icon green","topic":"update_attribute","payload":"{\"elementId\":\"camera_living\",\"attributeName\":\"fill\",\"attributeValue\":\"green\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":480,"y":300,"wires":[["f3e1600.918b6a"]]},{"id":"e51f4d2c.b6317","type":"inject","z":"60ad596.8120ba8","name":"Fill camera icon orange","topic":"update_attribute","payload":"{\"elementId\":\"camera_living\",\"attributeName\":\"fill\",\"attributeValue\":\"orange\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":480,"y":340,"wires":[["f3e1600.918b6a"]]},{"id":"a9f25ec5.4bec5","type":"inject","z":"60ad596.8120ba8","name":"Fill camera icon blue","topic":"update_attribute","payload":"{\"elementId\":\"camera_living\",\"attributeName\":\"fill\",\"attributeValue\":\"blue\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":470,"y":260,"wires":[["f3e1600.918b6a"]]},{"id":"f3e1600.918b6a","type":"ui_svg_graphics","z":"60ad596.8120ba8","group":"ba24f321.07795","order":1,"width":"14","height":"10","svgString":"<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n  <image width=\"889\" height=\"703\" id=\"background\" xlink:href=\"https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg\"/>\n  <circle id=\"pir_living\" cx=\"310\" cy=\"45\" r=\"5\" stroke-width=\"0\" fill=\"#FF0000\"/>\n  <text id=\"camera_living\" x=\"310\" y=\"45\" font-family=\"FontAwesome\" fill=\"blue\" stroke=\"black\" font-size=\"35\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\"></text>\n</svg>","clickableShapes":[{"targetId":"camera_living"}],"smilAnimations":[{"id":"myanimation","targetId":"pir_living","attributeName":"r","fromValue":"0","toValue":"40","trigger":"msg","duration":"2","repeatCount":"0","freeze":false}],"name":"","x":720,"y":300,"wires":[[]]},{"id":"ba24f321.07795","type":"ui_group","z":"","name":"Floorplan test","tab":"fb3be807.e7ef18","disp":true,"width":"14","collapse":false},{"id":"fb3be807.e7ef18","type":"ui_tab","z":"","name":"SVG","icon":"dashboard","disabled":false,"hidden":false}]
```
The control message looks like this:
```
"payload": {
    "elementId": "camera_living",
    "attributeName": "fill",
    "attributeValue": "orange"
}
"topic": "update_attribute"
```

### Start/stop animations
As stated above, the animations can be started/stopped via an input message (when the 'trigger' field has value 'msg').

For example let's visualize that the IP camera in the living room has detected motion:

![svg_animate_cam](https://user-images.githubusercontent.com/14224149/63217299-53d64900-c144-11e9-9df3-960cdb45c574.gif)

```
[{"id":"6ffd6cf6.f91834","type":"inject","z":"60ad596.8120ba8","name":"Start animation","topic":"trigger_animation","payload":"{\"elementId\":\"myanimation\",\"status\":\"start\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":740,"y":220,"wires":[["1fb8c46e.6bfb5c"]]},{"id":"8adfc00a.8696b","type":"inject","z":"60ad596.8120ba8","name":"Stop animation","topic":"trigger_animation","payload":"{\"elementId\":\"myanimation\",\"status\":\"stop\"}","payloadType":"json","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":740,"y":260,"wires":[["1fb8c46e.6bfb5c"]]},{"id":"1fb8c46e.6bfb5c","type":"ui_svg_graphics","z":"60ad596.8120ba8","group":"ba24f321.07795","order":1,"width":"14","height":"10","svgString":"<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n  <image width=\"889\" height=\"703\" id=\"background\" xlink:href=\"https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg\"/>\n  <circle id=\"pir_living\" cx=\"310\" cy=\"45\" r=\"5\" stroke-width=\"0\" fill=\"#FF0000\"/>\n  <text id=\"camera_living\" x=\"310\" y=\"45\" font-family=\"FontAwesome\" fill=\"blue\" stroke=\"black\" font-size=\"35\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\"></text>\n</svg>","clickableShapes":[],"smilAnimations":[{"id":"myanimation","targetId":"pir_living","attributeName":"r","fromValue":"0","toValue":"40","trigger":"msg","duration":"2","repeatCount":"0","freeze":false}],"name":"","x":960,"y":240,"wires":[[]]},{"id":"ba24f321.07795","type":"ui_group","z":"","name":"Floorplan test","tab":"fb3be807.e7ef18","disp":true,"width":"14","collapse":false},{"id":"fb3be807.e7ef18","type":"ui_tab","z":"","name":"SVG","icon":"dashboard","disabled":false,"hidden":false}]
```
The control message looks like this (with status is 'start' or 'stop'):
```
"payload": {
    "elementId": "myanimation",
    "status": "start"
}
"topic": "trigger_animation"
```
## Settings

### Show coordinates
When this option is selected, a ***tooltip*** will be displayed to show the current mouse location (i.e. X and Y coordinate):

![svg_tooltip_coordinates](https://user-images.githubusercontent.com/14224149/63231067-79cc1e00-c216-11e9-83de-f93931f6d489.gif)

This option has been introduced to simplify layouting during manual editing of the SVG string (without external SVG drawing tool).  Without this option determining the location of your shapes would require a lot of calculations or guessing ...

Remark: The location is measured in the SVG coordinate system, which means the origin (X=Y=0) is in the top left of your drawing.

## Various stuff

### Fontawesome icons
Fontawesome icons are used widely in Node-RED, and are in fact little SVG drawings on their own.  They are a very easy way e.g. to represent devices on a floorplan.  Such an icon can easily be added to your SVG drawing, by following these steps:

1. Search the [Fontawesome](https://fontawesome.com/v4.7.0/icons/) website for an icon that fits your needs.  For example 'fa-video-camera'.

2. Find the ***unicode*** for that icon in this [list](https://fontawesome.com/v4.7.0/cheatsheet/):

   ![unicode](https://user-images.githubusercontent.com/14224149/63217056-9e08fb80-c13f-11e9-8b48-0ec516752d90.png)
   
3. Create a ***'text'*** SVG element for font family 'FontAwesome' and the unicode as text value:
   ```
    <text id="camera_living" x="310" y="45" font-family="FontAwesome" fill="blue" stroke="black" font-size="35" text-anchor="middle" alignment-baseline="middle" stroke-width="1">&#xf03d;</text>
    ```
    
4. The result will be the fontawesome icon at the specified location:

   ![icon](https://user-images.githubusercontent.com/14224149/63217104-29828c80-c140-11e9-957b-22ea8eb9a0ed.png)
