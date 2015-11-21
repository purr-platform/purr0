<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Modules in Purr](#modules-in-purr)
- [Interfaces](#interfaces)
- [Modules](#modules)
- [Linking](#linking)
- [References](#references)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Modules in Purr

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
  import True, False from Data.Boolean

  export data List = Nil | left <> right

  export list empty? = match list with
    | Nil => True
    | _   => False
  end
end
```

# Interfaces

In Purr, interfaces are a tuple of unique name, metadata, and
constraints. Interfaces declare what it means to be something in Purr,
although modules can be supersets of those constraints.

```ruby
meta
| version: "1.0.0"
| author: "Purr"
| licence: "MIT"
interface Data.List is
  # Depends on definitions from these interfaces
  import Boolean from Data.Boolean
  import Any? from Purr.Core

  data List = Nil | (left :: Any?) <> (right :: List?)

  meta
  | doc: "True if the list has no elements."
  let (list :: List?) empty? -> Boolean
end
```

> **@TODO** should interfaces define which parameters implementations
> can accept as well?


# Modules

Modules in Purr are anonymous, parametric, and **applicative**. They always
must implement a single well-known interface. This means a few things:

- You **cannot** link against a module directly. Modules can only depend
  on **interfaces**. To prefer a particular implementation one can add
  additional constraints to the linking, based on the module's metadata.

- Modules can accept parameters when linking against them. Two
  instantiations of a module with the same parameters **result in the
  same module**. This is important for protocols.

- Because we need repeatability, each module gets a unique identifier
  generated for them. These can be used by the VM to allow users to fix
  linking rules. (this is less of a problem because modules are live
  objects in Purr, like in Smalltalk)

Additionally, all names in Purr are late bound. This includes the names
imported from other modules *AND* implementations of protocols. Making
everything late bound means we get to support mutually dependent
dependencies naturally.

On the other hand, since we **cannot** know which symbols a module exports
ahead of time(?), one needs to explicitly declare which symbols they want
from the module.

> **@TODO** can we statically define names from a module? What about
> differences between exported modules? Maybe check against the
> interface and require explicitly mentioning names not in the
> interface, that way we can throw early errors when the name doesn't
> exist.

> **@TODO** it's not possible to describe constraints in the module
> linking with Purr expressions (because we need to import the module
> first to use those expressions :P). So we need a very limited kind of
> constraint language. Maybe this can be used for contracts as well and
> aid soft typing?.


# Linking

Purr doesn't have a global namespace. Anything that a particular piece
of code uses has to be brought into scope. Purr also does not have a
**global linking space**. That means that not all modules can link
against all of the existing implementations. Instead, Purr introduces
the concept of a "search space".

A search space is a bucket containing a set of available module
implementations for linkage. A particular program may be comprised of
several search spaces. Modules at the top of the program define what
search spaces modules at the bottom may use *and* can filter these
spaces as they see fit. If a module doesn't define what search space
they want to use for linking, the default search space is used. This
allows third-party modules to link against the default search space,
and program-specific modules to use named search spaces.

> **@TODO** think about the consequences of named search spaces in
> moving these program-specific modules to shared modules.

This approach requires Purr to have an entry point module that provides
the necessary configuration.

> **@TODO** think about how to reduce the costs of configuration.

> **@TODO** in order to filter search spaces without loading modules one
> needs to come up with a constraint language for them too. This can
> be... uh, tricky.


# References

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
