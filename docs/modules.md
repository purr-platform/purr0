<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Modules in Purr](#modules-in-purr)
  - [Interfaces](#interfaces)
  - [References](#references)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

Modules in Purr
===============

Like Newspeak, the Purr language has no global namespace, which means
programmers need a different way of describing, loading, and using
components in their code.

To do so, Purr uses an approach similar to what David Barbour describes
in his modularity posts (see references). Modules are separated into
interfaces and implementation. Interfaces are an unique name, and
possibly contracts and constraints that its implementations should
fulfil. Modules declare which interface they implement, but are
anonymous. Modules can only depend on interfaces, not other concrete
modules.

```ruby
# Declares that the module implements the Data.List interface
# at version 2.* (using semver wildcards)
module Data.List @ 2.* is
  # Declares that the module depends on the interface Data.Boolean
  import Data.Boolean only (True, False)

  export data List = Nil | left <> right

  export list empty? = match list with
    | Nil => True
    | _   => False
  end
end
```

## Interfaces

In Purr, interfaces are a tuple of unique name, metadata, and
constraints. Interfaces declare what it means to be something in Purr,
although modules can be supersets of those constraints.

```ruby
meta
| version: "1.0.0"
| author: "Purr"
| licence: "MIT"
interface Data.List is
  # Depends on definitions from this interface
  import Data.Boolean
  import Purr.Core.MetaData

  data List = Nil | (left :: Any?) <> (right :: List?)

  meta
  | doc: "True if the list has no elements."
  let (list :: List?) empty? -> Boolean
end
```




## References

[Modularity Without a Name](https://awelonblue.wordpress.com/2011/09/29/modularity-without-a-name/)
: *David Barbour*

[Modules Divided: Interface and Implement](https://awelonblue.wordpress.com/2011/10/03/modules-divided-interface-and-implement/)
: *David Barbour*

A Ban on Imports [Part I](http://gbracha.blogspot.com.br/2009/06/ban-on-imports.html), [Part II](http://gbracha.blogspot.com.br/2009/07/ban-on-imports-continued.html)
: *Gilad Bracha*

[F-ing Modules](https://www.mpi-sws.org/~rossberg/f-ing/)
: *Andreas Rossberg, Claudio Russo, Derek Dreyer*

[Backpack: Retrofitting Haskell with Interfaces](http://plv.mpi-sws.org/backpack/)
: *Scott Kilpatrick, Derek Dreyer, Simon Peyton Jones, Simon Marlow*

<!--
Local Variables:
ispell-dictionary: british
End:
-->
