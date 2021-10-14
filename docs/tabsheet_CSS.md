# "CSS" tab sheet

![editor](https://user-images.githubusercontent.com/14224149/137393521-6aa58d3f-0e79-466c-8d02-654c95664f53.png)

Enter you CSS (Cascading Style Sheet) in this editor.  Note that this CSS is ***scoped***, which means it will only be applied to the SVG shapes used in this node!

The default CSS (which is already available at startup) will be sufficient for most users, and should only be removed in very specific use cases.  Of course it is always possible to keep the original default CSS and append your own custom CSS at the end (see example below).

At the bottom of the "CSS" tab sheet, a series of buttons are available:

![buttons](https://user-images.githubusercontent.com/14224149/137394458-98be045e-c462-424f-8139-75c9a5fd0bea.png)

+ *Expand CSS*: show the CSS in full screen mode.
+ *Format CSS*: by formatting the CSS, it will be beatified.  This means the indents will be corrected, ...
+ *Reset CSS*: remove the current CSS, and replace it by the original default CSS.

## Example of adding custom CSS

In this example flow we have two SVG nodes, and each one will display a circle.  But we add custom CSS to each node, to style each circle with its own color:

![CSS differences](https://user-images.githubusercontent.com/14224149/137398885-8ceb1219-1e41-4602-955b-37e06d65e619.png)

Since the scope of the CSS is limited to the SVG used in the same node, each circle will get its own color:

![Dashboard result](https://user-images.githubusercontent.com/14224149/137399213-59400b25-6d8c-4048-9e46-81b34c8172ee.png)

The example flow can be found here:
```
[{"id":"e1855e93be9d39d7","type":"ui_svg_graphics","z":"7f9646080c92c297","group":"a80872b69dcf44c9","order":11,"width":0,"height":0,"svgString":"<svg x=\"0\" y=\"0\" height=\"100\" viewBox=\"0 0 100 100\" width=\"100\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n   <circle cx=\"50\" cy=\"50\" r=\"30\"/>\n</svg>","clickableShapes":[],"javascriptHandlers":[],"smilAnimations":[],"bindings":[],"showCoordinates":false,"autoFormatAfterEdit":false,"showBrowserErrors":false,"showBrowserEvents":false,"enableJsDebugging":false,"sendMsgWhenLoaded":false,"noClickWhenDblClick":false,"outputField":"payload","editorUrl":"//drawsvg.org/drawsvg.html","directory":"","panning":"disabled","zooming":"disabled","panOnlyWhenZoomed":false,"doubleClickZoomEnabled":false,"mouseWheelZoomEnabled":false,"dblClickZoomPercentage":150,"cssString":"div.ui-svg svg{\n    color: var(--nr-dashboard-widgetColor);\n    fill: currentColor !important;\n}\ndiv.ui-svg path {\n    fill: inherit !important;\n}\ncircle {\n  fill: red;\n}\n\n","name":"","x":1140,"y":240,"wires":[[]]},{"id":"d3ee148a86dd7dfd","type":"ui_svg_graphics","z":"7f9646080c92c297","group":"a80872b69dcf44c9","order":11,"width":0,"height":0,"svgString":"<svg x=\"0\" y=\"0\" height=\"100\" viewBox=\"0 0 100 100\" width=\"100\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n   <circle cx=\"50\" cy=\"50\" r=\"30\"/>\n</svg>","clickableShapes":[],"javascriptHandlers":[],"smilAnimations":[],"bindings":[],"showCoordinates":false,"autoFormatAfterEdit":false,"showBrowserErrors":false,"showBrowserEvents":false,"enableJsDebugging":false,"sendMsgWhenLoaded":false,"noClickWhenDblClick":false,"outputField":"payload","editorUrl":"//drawsvg.org/drawsvg.html","directory":"","panning":"disabled","zooming":"disabled","panOnlyWhenZoomed":false,"doubleClickZoomEnabled":false,"mouseWheelZoomEnabled":false,"dblClickZoomPercentage":150,"cssString":"div.ui-svg svg{\n    color: var(--nr-dashboard-widgetColor);\n    fill: currentColor !important;\n}\ndiv.ui-svg path {\n    fill: inherit !important;\n}\ncircle {\n  fill: blue;\n}\n\n","name":"","x":1140,"y":280,"wires":[[]]},{"id":"a80872b69dcf44c9","type":"ui_group","name":"Scoped style demo","tab":"6f1c95444a84c32c","order":1,"disp":true,"width":"6","collapse":false},{"id":"6f1c95444a84c32c","type":"ui_tab","name":"SVG styles","icon":"dashboard","disabled":false,"hidden":false}]
```
