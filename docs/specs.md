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

### 1.1) Semantics

As a small functional language, the main building block of Phemme are
functions, which are first-class:

```hs
let a concat: b => a ++ b.
```

Functions are auto-curried, so you can partially apply them and get back
a new function:

```hs
let one-two-and-three = concat [1 2 3].
print (one-two-and-three [4]).

-- > [1 2 3 4]
```

Phemme also sports easily extensible syntax and expressive identifiers:

```hs
let a & b => a & b.
```

Lastly, we have abstract polymorphism the same way Clojure does it:

```hs
type <list> {
  "A list container"

  head: a. -- The first item of the list.
  tail: a. -- The rest of the list.
}.

implement list: as 
  <list> {
    head: as => first: as.
    tail: as => rest: as.
  }.

head: list: [1 2 3].
-- > 1
```

And for even more simplicity, the language is dynamically typed (with no
stinkin' null/undefined!), and all values are immutable by default. We
support the usual value types: `Boolean`, `Number`, `String`, `List` and
`Map`.


### 1.2) REST DSL

As the main goal of Phemme is to make it easier to write web servers,
REST handling is baked straight into the language, through the functions
`page:`, `get:`, `post:`, `put:`, etc. `page:` is the low-level
construct, which all the others build upon, and it's there if you need
to support additonal verbs.

Writing REST services is then as simple as:

```hs
`/ get:  |request| => "Hello, world."
`/ post: |request| => "Hello, " .. request/body.

"GET" page: `/:name |request| => "'Sup, " .. request/parms/name.
```


### 1.3) Syntax

Syntax is heavily influenced by Lisps (Clojure, Dylan), Haskell,
Smalltalk/Self, Ruby and Magpie. Mostly, functions are defined in terms
of keyword parameters, like in Smalltalk, except that messages are
defined through `Type` declarations, rather than objects, and which
message to call is defined at run-time.



## 2) Concepts

## 3) Program structure

## 4) Standard library

## 5) Formal syntax

```hs
-- * Basic stuff
comment :: "--" (anything but EOL)

-- * Values

-- ** Numbers

digit          :: "0" .. "9"
digits         :: digit+
sign           :: "+" | "-"
decimal-number :: sign digits ("." digits)?
                | digits ("." digits)?

hex-digit          :: "0" .. "9" | "a" .. "f"
hex-digits         :: hex-digit+
hexadecimal-number :: "16::" hex-digits

octal-digit  :: "0" .. "8"
octal-digits :: octal-digit+
octal-number :: "8::" octal-digits

binary-digit  :: "0" | "1"
binary-digits :: binary-digit+
binary-number :: "2::" binary-digits

number :: hexadecimal-number
        | octal-number
        | binary-number
        | decimal-number

-- ** String

string-escape :: '"'
string-char   :: (anything but string-escape)
string        :: '"' string-char* '"'
long-string   :: '"""' (anything) '"""'
keyword       :: "`" (anything but space)

-- ** Names

reserved     :: "=>" | "let" | "type" | "implement"
name-symbols :: "(" | ")" | "[" | "]" | "{" | "}" | "." | ":" | "|" | "`"
name-start   :: (none-of name-symbols | digits | space)
name-rest    :: (none-of name-symbols | space)
name         :: name-start name-rest* ?(not reserved)

-- ** List



```
