<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Language Layers](#language-layers)
  - [Kernel](#kernel)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

Language Layers
===============

The Purr language is divided in many layers, each of which add new
features to the language for a particular domain.


## Kernel

The `kernel` layer provides the most basic functionality for Purr. At
its core, Purr is a pure functional programming language, providing
primitive types and operations, function definitions, algebraic data
types, and pattern matching.

Functions are defined with a Smalltalk-inspired syntax:

```ruby
# Nullary functions
let x = ...

# Unary tupled functions 
let sum(tuple) = ...

# Unary functions
let x successor = ...

# Binary functions
let x + y = ...

# Keyword functions
let x between: y and: z = ...

# Keyword functions without a receiver
let from: x to: y = ...
```

Invocation of those functions use the same syntax as their definition:

```ruby
x   # invoke a nullary function (or evaluates a variable to its value)
1 successor
1 + 1
sum(1, 2, 3)
1 between: 0 and: 10
from: 1 to: 10
```

Precedence of the functions is fixed: nullary > tupled > unary > binary > keyword.

```ruby
from: x + y successor to: (increment: z predecessor * 2)
# is parsed as:
(from: (x) + ((y) successor) to: (increment: (((z) predecessor) * (2))))
```

Algebraic data types are defined with similar syntax. By convention,
they use PascalCase:


```ruby
data List = Empty | _ :: _
data Tuple = Cons: _ And: _
data Tuple2 = _ Cons: _
```

Pattern matching also follow from that structure:

```ruby
let list length = match list with
                  | Empty     => 0
                  | _ :: rest => 1 + rest length
                  end
```

The kernel also defines a few basic types: numbers (arbitrary
precision), floats, strings, functions, tuples.



<!--
Local Variables:
ispell-dictionary: british
fill-column: 72
End:
-->
