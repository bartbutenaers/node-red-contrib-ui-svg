# "Event" tab sheet

![event tabsheet](https://user-images.githubusercontent.com/14224149/65360241-70f8ae80-dbff-11e9-8c6a-65f3a14e22a7.png)

An SVG element can be added here, to make that element able to intercept one of the following events:
+ *Click*: when a mouse-down and mouse-up on the same element.
+ *Double click*: when a double mouse click on an element.  Note that there is a [setting](https://github.com/bartbutenaers/node-red-contrib-ui-svg/blob/master/docs/tabsheet_settings.md#send-output-msg-when-the-client-is-reloaded) to configure this event.
+ *Change*: when the value of a (foreign) input element is changed.
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

When adding a new line in this tab sheet, several properties need to be entered:
+ ***Selector***: the selection of (one or more) SVG elements that needs to intercept events. See the syntax of [CSS  selectors](https://www.w3schools.com/cssref/css_selectors.asp).
+ ***Action***: the event that the shape needs to intercept.
+ ***Payload***: the ```msg.payload``` content of the output message, which will be sent when the event occurs.
+ ***Topic***: the ```msg.topic``` content of the output message, which will be sent when the event occurs.

By default the content will be stored in ```msg.payload``` of the output message.  However when the result needs to end up in ```msg.anotherField```, this message field can be specified at the top of the tab sheet:

![image](https://user-images.githubusercontent.com/14224149/65385332-dd71cb80-dd2d-11e9-8ae9-7b604d3f077e.png)

Two things will happen when an event occurs on such an SVG element:
1. The mouse ***cursor*** will change when hoovering above the element, to visualize that an element responds to events.
1. An ***output message*** will be send as soon as the element is clicked, with a Node-RED [standard](https://discourse.nodered.org/t/contextmenu-location/22780/71?u=bartbutenaers) format:
   ```
   "elementId": "light_bulb_kitchen",
   "selector": "#light_bulb_kitchen",
   "event": {
      "type":"click",
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
   ```
   The coordinates (where the event occurs) in the output message allow the next nodes in the flow to display information at that location.  For example we have developed the [node-red-contrib-ui-contextmenu](https://github.com/bartbutenaers/node-red-contrib-ui-contextmenu) to show a popup context menu in the dashboard above the SVG drawing, at the location where a shape has been clicked.  The following demo explains this combination of both nodes:

   ![2019-09-22_14-12-06](https://user-images.githubusercontent.com/44235289/65387884-149ea780-dd43-11e9-9cd4-a6bb4fb59d65.gif)
   ```
   [{"id":"107fa0c1.cb755f","type":"debug","z":"60ad596.8120ba8","name":"Floorplan output","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","x":1340,"y":440,"wires":[]},{"id":"58329d91.3fc564","type":"ui_svg_graphics","z":"60ad596.8120ba8","group":"f014eb03.a3c618","order":1,"width":"14","height":"10","svgString":"<svg preserveAspectRatio=\"none\" x=\"0\" y=\"0\" viewBox=\"0 0 900 710\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n  <image width=\"889\" height=\"703\" id=\"background\" xlink:href=\"https://www.roomsketcher.com/wp-content/uploads/2016/10/1-Bedroom-Floor-Plans.jpg\"/>\n  <circle id=\"pir_living\" cx=\"310\" cy=\"45\" r=\"5\" stroke-width=\"0\" fill=\"#FF0000\"/>\n  <text id=\"camera_living\" x=\"310\" y=\"45\" font-family=\"FontAwesome\" fill=\"blue\" stroke=\"black\" font-size=\"35\" text-anchor=\"middle\" alignment-baseline=\"middle\" stroke-width=\"1\"></text>\n</svg>","clickableShapes":[{"targetId":"#camera_living","action":"click","payload":"camera_living","payloadType":"str","topic":"camera_living"}],"smilAnimations":[],"bindings":[],"showCoordinates":false,"autoFormatAfterEdit":false,"outputField":"","editorUrl":"http://drawsvg.org/drawsvg.html","directory":"","name":"","x":1140,"y":440,"wires":[["107fa0c1.cb755f"]]},{"id":"f014eb03.a3c618","type":"ui_group","z":"","name":"Floorplan test","tab":"80068970.6e2868","disp":true,"width":"14","collapse":false},{"id":"80068970.6e2868","type":"ui_tab","z":"","name":"SVG","icon":"dashboard","disabled":false,"hidden":false}]
   ```  
   The `msg.event` object contains multiple coordinates, corresponding to different available coordinate systems in a browser:

   ![Coordinate systems](https://user-images.githubusercontent.com/14224149/85235300-3fbe4080-b414-11ea-931d-acceb28a7789.png)

   + *SVG* coordinates to the borders of the SVG editor, i.e. relative to the origin of the SVG drawing.
   + *Client* coordinqtes to the borders of the Browser's visible window.
   + *Page* coordinates to the top of the current of the dashboard page, (which will only become visible after scrolling, since it is too short to show in the browser window).
   + *Screen* coordinates to the border of your monitor screen.
   
   Remark: the `msg.bbox` contains the bounding box (left / bottom / right / top) of the SVG element where the event occurs

Instead of specifying events in the config screen, it is also possible to add or remove events via input messages.  This is explained in the [Control via messages](#control-via-messages) section below.
