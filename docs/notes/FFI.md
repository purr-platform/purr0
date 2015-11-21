<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [FFI](#ffi)
  - [Overview](#overview)
  - [Anatomy of an Alien](#anatomy-of-an-alien)
  - [Future directions](#future-directions)
  - [References](#references)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

FFI
===

## Overview

Purr needs to interact cleanly with JavaScript first and foremost, but
it needs to do so while maintaining the security guarantees of Purr
code. This would be difficult if any code could invoke the FFI layer and
interact directly with JS.

Newspeak's work on Aliens is an interesting fit here, and it sits very
well on top of Purr's module system. With Aliens we can, not only
maintain OCS by not providing Aliens for modules that we don't want to,
but we can also easily support interactions with other languages and
platforms. Interacting with web services could be abstracted in an
Alien, for example.

The core idea is that one would define a Purr interface for the service
that will be provided. This allows one to switch between concrete
implementations (using different foreign APIs) if appropriate. Then, by
using an Alien, they would implement the module by having the operations
call to the foreign interface correctly.


## Anatomy of an Alien

An Alien is a module that knows how to interface with a foreign
system, and nothing else. There isn't a single interface that we can
call "Alien," because every interaction with a foreign system is
entirely different (you don't have to `free` in JavaScript, but you have
to do so in C. However, you don't call methods in C, but you do so in
JavaScript). So, there are many "Alien" interfaces, and the concrete
implementations do the actual talking to these systems.

> **@TODO**:
> Does it make sense to have different implementations of an
> Alien with the same interface?

An example interface for talking to JavaScript could be:

```ruby
interface Alien.JavaScript is
  data JS = Null
          | Undefined
          | Number: _
          | String: _
          | Boolean: _
          | Function: _
          | Object: _

  # Constructing new objects / exporting
  let null -> JS
  let undefined -> JS
  let number: _ -> JS
  let string: _ -> JS
  let boolean: _ -> JS
  let function: _ -> JS
  let object: _ -> JS
  let global -> JS
  let require: _ -> JS

  # Built-in operators
  protocol MathOp is
    _ + _ -> JS
    _ * _ -> JS
    _ / _ -> JS
    _ - _ -> JS
    _ % _ -> JS
    _ & _ -> JS
    _ | _ -> JS
    _ ^ _ -> JS
    _ >> _ -> JS
    _ << _ -> JS
    _ >>> _ -> JS
    _ && _ -> JS
    _ || _ -> JS
    _ not -> JS
    _ == _ -> JS
    _ === _ -> JS
    _ != _ -> JS
    _ !== _ -> JS
    _ > _ -> JS
    _ < _ -> JS
    _ >= _ -> JS
    _ <= _ -> JS
    _ delete: _ -> JS
    _ at: _ -> JS
    _ typeof -> JS
    _ has: _ -> JS
    _ instanceof: _ -> JS
    _ new-with: _ -> JS
    _ call-on: _ with: _ -> JS
  end
end
```

One would be able to use it for writing objects that interact with the
environment like this:

```ruby
module Node.FileSystem is
  import Alien.JavaScript
    only (null, string:, function:, require:, at:, call-on:with:)

  lazy fs = require: "fs"

  export file write: data then: callback =
    fs at: "writeFile"
    |> call-on: null
       with: (string: file, string: "0777", string: data, function: callback)
end
```


## Future directions

- **@TODO** Alien usage can get verbose, so it'd be nice if we could
  automatically generate a good interface that bridges the two
  worlds. This might be simpler to do for JS (Mermaid had a similar
  layer).
  



## References

[Unindentified Foreign Objects (UFOs)](http://gbracha.blogspot.com.br/2008/12/unidentified-foreign-objects-ufos.html)
: Gilad Bracha

[Why Not FFI](https://awelonblue.wordpress.com/2013/04/16/why-not-ffi/)
: David Barbour

[Alien Foreign Function Interface User Guide](http://wiki.squeak.org/squeak/uploads/6100/Alien%20FFI.2.pdf)
: Eliot Miranda

<!--
Local Variables:
ispell-dictionary: british
fill-column: 72
End:
-->
