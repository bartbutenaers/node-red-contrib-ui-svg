# node-red-contrib-ui-svg
A Node-RED widget node to show interactive SVG (vector graphics) in the dashboard

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install bartbutenaers/node-red-contrib-ui-svg
```

***!!!!! USE THE ABOVE COMMAND TO INSTALL IT DIRECTLY FROM GITHUB (NOT AVAILABLE ON NPM YET) !!!!***
***!!!!! ONLY USE IT FOR TESTING PURPOSES !!!!***
***!!!!! PROBABLY THE API WILL BE CHANGED SOON, WHICH MEANS SVG DATA WILL BE LOST !!!!***
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

### SVG editor

![editor](https://user-images.githubusercontent.com/14224149/63208202-86932980-c0d1-11e9-94e3-6e95ac3790ff.png)

Enter you (XML-based) SVG graphics in this editor.  This can be done in two ways:
+ If you know how SVG works, you can compose the SVG manually.
+ If your SVG knowledge is limited, you can use a third party SVG editor to create your drawing.  Multiple (online) editors are free available, each with their own dedicated speciality:
   + [SVG-Edit](https://svg-edit.github.io/svgedit/releases/svg-edit-2.8.1/svg-editor.html)
   + [Floorplanner](http://floorplanner.com)
   + [Floorplancreator](https://floorplancreator.net/#pricing)
   + ...

Cautions: 
1. Be aware that those third-party SVG editors will create rather complex SVG strings, which are harder to understand when you want to change them manually afterwards.
2. Be aware that the browser has a lot of work to render all the SVG elements in the drawing!  To gain performance it is advised not to simply past the SVG string into the editor, but create an image from it.  For example in Floorplanner website, the SVG drawing can be saved as a JPEG/PNG image.  That image can be loaded into an SVG *'image'* element, like I have done in the example flows on this readme page ...

### SMIL animations

![animations](https://user-images.githubusercontent.com/14224149/63208319-ea6a2200-c0d2-11e9-953b-59f9096027e1.png)

SVG allows users to animate element properties over time.  For example you can make the radius of a circle grow in 3 seconds from 10 pixels to 40 pixels.

Adding animations to your SVG graphics can be done in two ways:
+ If you know how animations in SVG work, you can add the animation in the SVG editor manually:
   ```
   <circle id="mycircle" ... r="5" ...>
      <animate id="myanimation" attributeName="r" begin="0s" dur="3s" repeatCount="1" from="10" to="40"/>
   </circle>
   ```

+ If your SVG knowledge is limited, you can click the *'add'* button to create a new animation record.  A number of properties need to be entered:
   + ***Id***: The id of this SVG animate element (in this example *"myanimation"*).
   + ***Target***: The id of the SVG element that you want to animate (in this example *"mycircle"*).
   + ***Attribute***: The name of the element's attribute that you want to animate (in this example *"r"*).
   + ***From***: The attribute value at the start of the animation (in this example *"10"*).
   + ***To***: The attribute value at the end of the animation (in this example *"40"*).
   + ***Trigger***: When you want to start the animation (in this example *"0s"* which means 0 seconds, so immediately).  An extra ***"msg"*** trigger has been added, to start/end the animation via an input message.  See example in section 'control via messages'.
   + ***Duration***: How long the animation will take (in this example *"3s"* which means 3 seconds).
   + ***Repeat***: How many times the animation needs to be repeated (in this example *"1" which means only once).  Caution: when *"0"* is selected, this means that the animation will be repeated ***"indefinite"***!
   + ***Freeze***: When selected the attribute will keep the new *'To'* value (in this example *"40"*) when the animation is completed.  When not selected, the attribute will go back to its original value (in this example *"5"*) when the animation is completed.
   
   Another advantage of creating animations on this tabsheet is to keep your SVG drawing and the animations separate.  More specifically when the SVG is being created in a third-party SVG editor (which most of the time don't support animations), your manullay inserted animation elements would be overwritten each time you need to update your SVG...

### Clickable shapes

![clickables](https://user-images.githubusercontent.com/14224149/63216642-942fca00-c138-11e9-94e2-34fd25eda935.png)

The id of an SVG element can be added here, to make that element clickable.  This means that the mouse ***cursor*** will change when hoovering above the element, and an ***output message*** will be send as soon as the element is clicked:

![svg_click_cam](https://user-images.githubusercontent.com/14224149/63216845-b4ad5380-c13b-11e9-8aaf-c63b29a194ca.gif)

```
[{"id":"f3883602.216b58","type":"debug","z":"60ad596.8120ba8","name":"Floorplan output","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":920,"y":220,"wires":[]},{"id":"1fb8c46e.6bfb5c","type":"ui_svg_graphics","z":"60ad596.8120ba8","group":"ba24f321.07795","order":1,"width":"14","height":"10","svgString":"<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n  <image width=\"889\" height=\"703\" id=\"background\" xlink:href=\"https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg\"/>\n  <circle id=\"pir_living\" cx=\"310\" cy=\"45\" r=\"5\" stroke-width=\"0\" fill=\"#FF0000\"/>\n  <text id=\"camera_living\" x=\"310\" y=\"45\" font-family=\"FontAwesome\" fill=\"blue\" stroke=\"black\" font-size=\"35\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\"></text>\n</svg>","clickableShapes":[{"targetId":"camera_living"}],"smilAnimations":[],"name":"","x":720,"y":220,"wires":[["f3883602.216b58"]]},{"id":"ba24f321.07795","type":"ui_group","z":"","name":"Floorplan test","tab":"fb3be807.e7ef18","disp":true,"width":"14","collapse":false},{"id":"fb3be807.e7ef18","type":"ui_tab","z":"","name":"SVG","icon":"dashboard","disabled":false,"hidden":false}]
```

## Control via messages
Most of the SVG information can be controlled by sending input messages to this node.

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
