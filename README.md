# Phemme

Phemme is a small, portable functional language for easily writing highly
concurrent web-servers. It poses itself as a
["better PHP"](http://www.pltgames.com/competition/2013/5), but it actually
runs on top of Node, and as such can use anything Node gives you!


## Example

A simple "Hello, World!" in Phemme:

```hs
page / {request} => text "Hello, world!".
```


## Installing

Grab it from NPM:

    $ npm install -g phemme
    

## Licence

MIT/X11. Which means you just do whatever the fuck you want to.
