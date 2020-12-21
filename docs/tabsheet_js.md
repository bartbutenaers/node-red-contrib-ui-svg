# "JS" tab sheet

![JS tabsheet](https://user-images.githubusercontent.com/14224149/97640631-7864cb00-1a41-11eb-94b8-742a526978fa.gif)

An SVG element can be added here, to make that element able to intercept one of the events: see "Event" tabsheet section above.

When adding a new line in this tab sheet, several properties need to be entered:
+ ***Selector***: the selection of (one or more) SVG elements that needs to intercept events. See the syntax of [CSS  selectors](https://www.w3schools.com/cssref/css_selectors.asp).
+ ***Action***: the event that the shape needs to intercept.
+ ***Javascript code***: the Javascript code that needs to be executed on the client side (i.e. inside the dashboard), when the event occurs.

Note that there is a *'fullscreen"* button at every row, to show the Javascript code in a fullscreen editor with syntax highlighting!

Two things will happen when an event occurs on such an SVG element:
1. The mouse ***cursor*** will change when hoovering above the element, to visualize that an element responds to events.
1. The Javascript code will be executed in the dashboard.

Instead of specifying Javascript events in the config screen, it is also possible to add or remove events via input messages.  This is explained in the [Control via messages](#control-via-messages) section below.  When your Javascript code doesn't work correctly, the wiki [page](https://github.com/bartbutenaers/node-red-contrib-ui-svg/wiki/Troubleshooting-JS-event-handlers) contains some tips and tricks.

The following example flow shows how to change the color of the circle, every time the circle has been clicked.  The flow also shows that the Javascript event handler can be removed, and another Javascript event handler (to show an alert) can be injected via an input message:

![javascript flow](https://user-images.githubusercontent.com/14224149/98599183-e16aff00-22db-11eb-8051-3d996ce46052.png)
```
[{"id":"89244415.be9278","type":"ui_svg_graphics","z":"a03bd3cf.177578","group":"5ae1b679.de89c8","order":4,"width":"0","height":"0","svgString":"<svg x=\"0\" y=\"0\" height=\"350\" viewBox=\"-0.04032258064515237 0 250.0806451612903 350\" width=\"250\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" preserveAspectRatio=\"xMidYMid meet\">\n<circle id=\"my_circle\" cx=\"30\" cy=\"30\" r=\"25\" style=\"stroke: none; fill: #0000ff;\">\n</circle>\n</svg>","clickableShapes":[],"javascriptHandlers":[{"selector":"#my_circle","action":"click","sourceCode":"var letters = '0123456789ABCDEF';\n  var color = '#';\n  for (var i = 0; i < 6; i++) {\n    color += letters[Math.floor(Math.random() * 16)];\n  }\n\n$(\"#my_circle\")[0].style.fill = color;\n \n$scope.send({payload: color, topic: 'circle_color'})"}],"smilAnimations":[{"id":"","targetId":"","classValue":"","attributeName":"transform","transformType":"rotate","fromValue":"","toValue":"","trigger":"msg","duration":"1","durationUnit":"s","repeatCount":"0","end":"restore","delay":"1","delayUnit":"s","custom":""}],"bindings":[],"showCoordinates":false,"autoFormatAfterEdit":true,"showBrowserErrors":true,"showBrowserEvents":true,"outputField":"payload","editorUrl":"http://drawsvg.org/drawsvg.html","directory":"","panning":"disabled","zooming":"disabled","panOnlyWhenZoomed":false,"doubleClickZoomEnabled":false,"mouseWheelZoomEnabled":false,"name":"SVG with Javascript","x":540,"y":180,"wires":[["e06da0e0.2c837"]]},{"id":"d9df6292.785bc","type":"inject","z":"a03bd3cf.177578","name":"Show alert at click","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"{\"command\":\"add_js_event\",\"event\":\"click\",\"selector\":\"#my_circle\",\"script\":\"alert('Click event handled on the client ...')\"}","payloadType":"json","x":230,"y":140,"wires":[["89244415.be9278"]]},{"id":"5074f893.d378d8","type":"inject","z":"a03bd3cf.177578","name":"Remove clicked event","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"{\"command\":\"remove_js_event\",\"event\":\"click\",\"selector\":\"#my_circle\"}","payloadType":"json","x":240,"y":180,"wires":[["89244415.be9278"]]},{"id":"e06da0e0.2c837","type":"debug","z":"a03bd3cf.177578","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":750,"y":180,"wires":[]},{"id":"8572fad7.dd39b8","type":"inject","z":"a03bd3cf.177578","name":"change color at click","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"{\"command\":\"add_js_event\",\"event\":\"click\",\"selector\":\"#my_circle\",\"script\":\"var letters = '0123456789ABCDEF';  var color = '#';  for (var i = 0; i < 6; i++) {    color += letters[Math.floor(Math.random() * 16)];  } $('#my_circle')[0].style.fill = color; $scope.send({payload: color, topic: 'circle_color'})\"}","payloadType":"json","x":230,"y":280,"wires":[["89244415.be9278"]]},{"id":"f678a359.157b4","type":"comment","z":"a03bd3cf.177578","name":"Multiline program ...","info":"","x":220,"y":240,"wires":[]},{"id":"5ae1b679.de89c8","type":"ui_group","name":"Press Demo","tab":"3667e211.c08f0e","order":1,"disp":true,"width":"5","collapse":false},{"id":"3667e211.c08f0e","type":"ui_tab","name":"Home","icon":"dashboard","order":1,"disabled":false,"hidden":false}]
```
Which will result in this:

![javascript flow demo](https://user-images.githubusercontent.com/14224149/97641343-f83f6500-1a42-11eb-957e-4180e64f37cb.gif)

The main ***difference*** between the events on the "Event" tabsheet and Javascript events on the "JS" tabsheet:
+ The "Event" tabsheet is used when an event simply needs to send an output message, which in turn can trigger some other nodes in the flow on the server.  E.g. click a light-bulb icon to turn on the lights in your smart home.

+ The "JS" tabsheet is used when an event simply needs to trigger some Javascript code, to trigger functionality directly in the SVG. 

Note that there is some overlap between the events on both tabsheets:
+ The "Event" tabsheet could be used to trigger an output message on the server flow, which triggers in turn an input message for this SVG node.  That input message can manipulate the SVG.  However then we have an entire *roundtrip* (from dashboard via the server flow back to the dashboard) to trigger functionality on the dashboard:

  ![roundtrip](https://user-images.githubusercontent.com/14224149/97758960-47979b00-1b00-11eb-8bda-c5aaec44102b.png)
   
  Instead it is much easier to use a JS event handler to stay inside the dashboard and run some Javascript code immediately:
  
  ![event handler](https://user-images.githubusercontent.com/14224149/97759364-2c795b00-1b01-11eb-926e-a3f66455daf8.png)

+ The "JS" tabsheet could be used to trigger some Javascript code to send a message to the server flow.  For example:
   ```
   $scope.send({payload: color, topic: 'circle_color'})
   ```
   However it is much easier to use a normal event handler, which sends a message (incl. bounding box and all coordinates) without any coding...
