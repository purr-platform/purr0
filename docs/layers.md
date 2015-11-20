Language Layers
===============

The Purr language is divided in many layers, each of which add new
features to the language for a particular domain.


## Core

The `core` layer provides the most basic functionality for Purr. At its
core, Purr is a pure functional programming language, providing
functions, algebraic data types, and pattern matching.

Functions are defined with a Smalltalk-inspired syntax:

```ruby
# Nullary functions
let x = ...

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
1 between: 0 and: 10
from: 1 to: 10
```

Precedence of the functions is fixed: nullary > unary > binary >
keyword.

```ruby
from: x + y successor to: (increment: z predecessor * 2)
# is parsed as:
(from: (x) + ((y) successor) to: (increment: (((z) predecessor) * (2))))
```

Algebraic data types are defined with similar syntax:


```ruby

```


<!--
Local Variables:
ispell-dictionary: british
fill-column: 72
End:
-->
