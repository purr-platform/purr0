# Purr Specification

This is a draft of Purr's language specification.

Some of the features it offers:

  - Dynamic typing with soft contract verification;
  - Persistent data structures by default;
  - Expressive/extensible Smalltalk-inspired syntax;
  - Ad-hoc polymorphism with protocols;
  - First-class EDSLs;
  - First-class, mutually-recursive parametric (generative) modules;
  - NO global namespace;
  - Partial application syntax;
  - Task-based concurrency, Machine-based streams;
  - Complex pattern matching;
  - Algebraic Data Types: sums, products, and extensible records;
  - Higher-order contracts;
  - Integrated testing;


## 0) Prelude

Purr is a small language for writing concurrent and safe web-servers. It's a
hosted language with Node.js as its initial target, and a goal of fully
integrating with the host platform (like Clojure).

At its core, Purr is a fairly simple pure and strict functional language, with
first-class functions, algebraic data types and pattern matching. Definition
syntax is the same as the invocation syntax. People familiar with languages
like ML and Haskell should be familiar with most concepts:

```ruby
data Natural = Zero | _ Successor

let zero => Zero

let $x succ => $x Successor
let $x pred => match $x with
               | $x' Successor => $x'
               end

let $x + $y => $x add: $y ignore: 0

let $x add: $y ignore: $z => match $x with
                             | Zero => $y
                             | _    => $x succ add: $y pred ignore: $z
                             end
```

For ad-hoc polymorphism, Purr uses protocols, which are pretty similar to
Haskell's type classes:

```ruby
interface Equality is
  method _ === _
end

implement Equality for Natural with
  method $x === $y => match $x, $y with
                      | Zero, Zero                   => true
                      | $x' Successor, $y' Successor => $x' === $y'
end
```

The use of Task-based concurrency along with language support for monadic
sequencing makes common concurrency tasks relatively simple, since Tasks also
handle resource life-cycles:

```ruby
do {
  $files   <- ("Public" \ "Texts") list-directory;
  $content <- ($files map: _ read) parallel;
  ($content join: "\n") display
}
```

Other supported forms of concurrency include Machine-based streams (which also
handle resource life-cycles), and Communicating Sequential Process
channels. Transducers provide a high-level way of transforming all collections,
including these two.

While Purr isn't a typed language, it supports testing at the language level,
and higher-order contracts, which are partially verified at compile time:

```ruby
# Syntax not final
let $x sqrt
  | ($x > 0) -> ^{_ $y => ($y > 0) && (($x * $x) === $y)}
=> ...

let $xs map: $f
  | _ list-of?: Integer -> _ list-of?: Integer
=> match $xs with
   | Nil        => Nil
   | $x :: $xs' => $f($x) :: ($xs' map: $f)
   end
satisfying
  examples
  | ([1, 2, 3] map: _ + 1) === [2, 3, 4]
  end
  
  laws
  | identity($xs ^Integer List) => ($xs map: _ identity) === $xs
  end
end
```

Modules in Purr are parametric and generative, and while the language supports
first-class lexical scopes (scopes are extensible records!) there is no global
namespace in the language. This makes Object Capability Security natural:

```ruby
module Main1 using: $Platform is
  use Purr.Prelude using: $Platform
  # `self` is the current lexical scope
  use My.Module using: (self without: [`says-hello:]) only [says-hello:]

  let $x display => $x to-string + ", was said."
  let $x + $y => $x + " + (" + $y + ")"

  # Returns "Alice + (greeted + (Bob))"
  let main => "Alice" says-hello: "Bob"
end

module Main2 using: $Platform is
  use My.Module using: $Platform

  # Returns "Alice greeted Bob"
  let main => "Alice" says-hello: "Bob"
end

module Main3 using: $Platform is
  use My.Module using: {}

  # ReferenceError: "+" is not defined.
  let main => "Alice" says-hello: "Bob"
end

module My.Module using: $Platform is
  use $Platform

  let $name hello: $other => ($name + " greeted " + $other) display
end
```




## 1) Overview of Purr




## 2) Concepts

## 3) Program structure

## 4) Standard library

## 5) Formal syntax

```hs
```
