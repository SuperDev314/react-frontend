Vendored postcss source as of [31ae472](https://github.com/postcss/postcss/tree/31ae4724afbc02e103711fec6517ba485177d827) (latest release 5.2.0)

Vendored postcss-nested source as of [e709092](https://github.com/postcss/postcss-nested/tree/e7090926839cf916f6a24c3ad4079c1206d93b2d)

Then hacked things around:

* Deleted `previous-map.js` and all references to it because it `require('fs')`ed
* Delted reference to `postcss` within `postcss-nested` & simply exported the transform function
