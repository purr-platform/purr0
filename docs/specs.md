# Phemme Specification

This is a draft of Phemme's language specification.

Some of the features it offers:

  - Promise-based everything;
  - Functional, auto-currying;
  - Extensible syntax Smalltalk style;
  - Dynamically typed;
  - Immutable everything;
  - Ad-hoc polymorphism with protocols;


## 0) Prelude

Phemme is a small domain-specific language for writing highly-concurrent
web-servers. It runs on top of Node, and integrates fully with its host,
so you can use any Node library. Most of the difference comes from the
fact that Phemme uses promises all the way down, so you don't need to
concern yourself with callbacks and all that.

Besides this, Phemme is a functional language with extensible syntax and
ad-hoc polymorphism (Clojure style). And it's syntax absolutely rocks
for writing RESTful services.


## 1) Overview of Phemme

### 1.1) Semantics

As a small functional language, the main building block of Phemme are
functions, which are first-class:

```hs
let a concat: b => a ++: b.
```

Functions are auto-curried, so you can partially apply them and get back
a new function:

```hs
let one-two-and-three = concat [1 2 3].
print (one-two-and-three call: [4]).

-- > [1 2 3 4]
```

Phemme also sports easily extensible syntax and expressive identifiers:

```hs
let a & b => a &: b.
```

Lastly, we have abstract polymorphism the same way Clojure does it:

```hs
interface @list {
  "A list container"

  head: a. -- The first item of the list.
  tail: a. -- The rest of the list.
}.

implement | list: as |
  @list {
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


### 1.3) Node literals

Since most of the time people will be likely dealing with either JSON or
HTML, Phemme tries to make it easier to encode those by providing Node
literals, which can be used to make HTML documents quite easily:


```hs
let page-head = <head>
                  <meta charset = "utf-8" />
                  <title>"foo"</title>
                </head>
```

Basically, nodes create Node objects, and can contain any valid Phemme
expression.

### 1.4) Syntax

Syntax is heavily influenced by Lisps (Clojure, Dylan), Haskell,
Smalltalk/Self, Ruby and Magpie. Mostly, functions are defined in terms
of keyword parameters, like in Smalltalk, except that messages are
defined through `Interface` declarations, rather than objects, and which
message to call is defined at run-time.



## 2) Concepts

## 3) Program structure

## 4) Standard library

## 5) Formal syntax

```hs
-- # Basic stuff -------------------------------------------------------
comment :: "--" (anything but EOL)


-- # Values ------------------------------------------------------------
value :: number | string | list | node | map | lambda | name


-- ## Numbers ----------------------------------------------------------
digit          :: "0" .. "9"
digits         :: digit+
sign           :: "+" | "-"
decimalNumber  :: sign digits ("." digits)?
                | digits ("." digits)?

hexDigit          :: "0" .. "9" | "a" .. "f"
hexDigits         :: hexDigit+
hexadecimalNumber :: "16::" hexDigits

octalDigit  :: "0" .. "8"
octalDigits :: octalDigit+
octalNumber :: "8::" octalDigits

binaryDigit  :: "0" | "1"
binaryDigits :: binaryDigit+
binaryNumber :: "2::" binaryDigits

number :: hexadecimalNumber
        | octalNumber
        | binaryNumber
        | decimalNumber


-- ## String -----------------------------------------------------------
stringEscape :: '"'
stringChar   :: (anything but stringEscape)
textString   :: '"' stringChar* '"'
docString    :: '"""' (anything) '"""'
keyword      :: "`" (anything but space)
string       :: keyword | docString | textString


-- ## Names ------------------------------------------------------------
reserved    :: "=>" | "=" | "<:" | "let" | interface" | "implement"
nameSymbols :: "(" | ")" | "[" | "]" | "{" | "}" | "<" | ">" | "." | ":" | "|" | "`" | "#"
nameStart   :: (none-of nameSymbols | digits | space)
nameRest    :: (none-of nameSymbols | space)
name        :: nameStart nameRest* ?(not reserved)


-- ## List -------------------------------------------------------------
list :: "[" value* "]"


-- ## Map --------------------------------------------------------------
mapField :: name "=" value
map :: "<[" mapField* "]>"


-- ## Trees ------------------------------------------------------------
node           :: singleton-node
                | container-node
singleton-node :: "<" nodeHead map-field* "/>"
container-node :: "<" nodeHead map-field* "/>" expression* "</" name ">"
nodeHead       :: name idSpec? classSpec*
idSpec         :: "#" name
classSpec      :: "." name


-- ## Function ---------------------------------------------------------
lambda              :: lambdaArgs "=>" expression
lambdaArgs          :: "|" name* "|"
functionDeclaration :: fnDeclArgs "=>" expression
fnDeclArgs          :: (fnKeyword | name)*
fnKeyword           :: name ":"


-- # Expressions -------------------------------------------------------
declaration :: ( letDeclaration
               | interfaceDeclaration
               | implementDeclaration
               | expression
               )
               "."

expression :: blockExpression
              invocation
              groupExpression
              value

blockExpression :: "{" declaration* "}"
groupExpression :: "(" expression ")"

letDeclaration     :: "let" (functionDeclaration | bindingDeclaration)
bindingDeclaration :: name "=" expression

interfaceDeclaration :: "interface" name "{" interfaceBlock "}"
interfaceBlock       :: (optional string) functionInterface*
functionInterface    :: fnDeclArgs "."

implementDeclaration :: "implement" constructor interfaceImpl*
constructor          :: "|" fnKeyword name* "|"
interfaceImpl        :: name implBlock
implBlock            :: "{" functionDeclaration* "}"

invocation         :: expression* fn-keyword expression+

program :: declaration*
```
