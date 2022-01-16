# "Editor" tab sheet

[DrawSvg](http://drawsvg.org/) is a free SVG drawing editor that will run entirely in your browser, so no installation required.  We have integrated DrawSvg into this node, to allow users to edit their SVG source via a nice drawing program.

***!!! DrawSvg is free software.  Note that DrawSvg and the online service is used as is without warranty of bugs !!!***

## Update: DrawSvg 9.5 is only partly free
Some users reported that starting from DrawSvg version 9.5, there are now two separate profiles.  See the [readme](https://github.com/bartbutenaers/node-red-contrib-drawsvg#update-drawsvg-95-is-only-partly-free) page of the node-red-contrib-drawsvg node for more information about this.

## Getting started

![launch_editor](https://user-images.githubusercontent.com/44235289/66716981-f40ac000-edcb-11e9-96b5-69e11220b71d.gif)

Steps to use DrawSvg:
1. Click the *"Open SVG editor"*, to show the SVG in the [DrawSvg](#DrawSvg-drawing-editor) drawing editor.
2. DrawSvg will be opened in a popup dialog window, and it will visualize the SVG source (from this node).
3. The SVG drawing can be edited.
4. You can intermediately save your changes (to this node), using the *"Save"* button in the upper right corner of the popup dialog window.
5. As soon as the popup dialog window is being closed, a notification will appear.  There you can choose to ignore all changes (i.e. you do not need them anymore), or to save all the changes (to this node).
6. The updated SVG source will appear in the *"SVG source"* tab sheet of this node.

By default, this node will use the free online DrawSvg service (see *"Editor URL"* in the "Settings" tab sheet).  However we it is also possible to use the [node-red-contrib-drawsvg](https://github.com/bartbutenaers/node-red-contrib-drawsvg) node, which can host a DrawSvg service locally for offline systems.
