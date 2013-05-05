# Phemme Specification

This is a draft of Phemme's language specification.

Some of the features it offers:

  - Promise-based everything;
  - Functional, auto-currying;
  - Extensible syntax Smalltalk style;
  - Dynamically typed;
  - Immutable everything;
  - Abstract polymorphism with protocols;


## 0) Prelude

Phemme is a small domain-specific language for writing highly-concurrent
web-servers. It runs on top of Node, and integrates fully with its host,
so you can use any Node library. Most of the difference comes from the
fact that Phemme uses promises all the way down, so you don't need to
concern yourself with callbacks and all that.

Besides this, Phemme is a functional language with extensible syntax and
abstract polymorphism (Clojure style). And it's syntax absolutely rocks
for writing RESTful services.


## 1) Overview of Phemme

As a small functional language, the main building block of Phemme are
functions, which are first-class:

```hs
let a concat: b => a ++ b.
```

Functions are auto-curried, so you can partially apply them and get back
a new function:

```hs
let one-two-and-three = [1 2 3] concat.
print: one-two-and-three: [4].

-- |> [1 2 3 4]
```

Phemme also sports easily extensible syntax and expressive identifiers:

```hs
let a ++: b => a concat: b.
```

Lastly, we have abstract polymorphism the same way Clojure does it:

```hs
type <list> {
  "A list container"

  head: a. -- The first item of the list.
  tail: a. -- The rest of the list.
}.

implement list: as {
  head: a => first: a.
  tail: a => rest: a.
}.
```

And for even more simplicity, the language is dynamically typed (with no
nullary types!), and all values are immutable by default. We support the
usual value types: `Boolean`, `Number`, `String`, `List` and `Map`.
