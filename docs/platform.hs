-- The Phemme platform has the following libraries

-- | Core functionality of Phemme
module Phemme.Core where

-- | Attachs documentation to an object
_ doc: String -> Function -> Function
-- | Retrieves documentation from an object
a doc -> Maybe String
-- | Alias to `true`
otherwise -> Boolean
-- | Retrieves the internal `tag' of an object
a tag -> String

-- | Predicates
a Number?        -> Boolean
a String?        -> Boolean
a Boolean?       -> Boolean
a Function?      -> Boolean
a Ordering?      -> Boolean
a Maybe?         -> Boolean
a Either?        -> Boolean
a List?          -> Boolean
a Equality?      -> Boolean
a Ordered?       -> Boolean
a Representable? -> Boolean
a Bounded?       -> Boolean
a Enumerable?    -> Boolean
a Indexable?     -> Boolean
a Sliceable?     -> Boolean
a Semigroup?     -> Boolean
a Monoid?        -> Boolean
a Functor?       -> Boolean
a Applicative?   -> Boolean
a Chainable?     -> Boolean

-- | Data structures
data Ordering = Less | Equal | Greater
data Maybe    = Nothing | a Just
data Either   = a Failure | a Success
data List     = Nil | a :: List
data DivisionResult { quotient :: Integral, remainder :: Integral }
  

-- | Protocols
class Equality where
  a === a -> Boolean
  a =/= a -> Boolean

class Equality => Ordered where
  a compare-to: a -> Ordering
  a < a -> Boolean
  a > a -> Boolean
  a <= a -> Boolean
  a >= a -> Boolean
  a max: a -> a
  a min: a -> a

class Numeric where
  a - a -> a
  a * a -> a
  a negate -> a
  a absolute -> a

class Numeric => Integral where
  a divide-by: a -> DivisionResult
  a modulus: a -> a

class Numeric => Floating where
  a / a -> a
  a truncate -> a
  a round -> a
  a ceiling -> a
  a floor -> a
  a is-nan? -> a
  a is-infinite? -> a
  a is-finite? -> a
  a is-negative-zero? -> a

class Representable where
  a describe -> String

class Parseable where
  Parseable parse: String -> Either(String, a)

class Bounded where
  B a lower-bound -> a
  B a upper-bound -> a

class (Bounded, Ordered) => Enumerable where
  a successor -> a
  a predecessor -> a
  a up-to: a -> List a

class Indexable where
  I a at: b -> Maybe a
  I a includes?: b -> Boolean

class Indexable => Container where
  M a at: b put: a -> M a
  M a remove-at: b -> M a

class (Bounded, Indexable) => Sliceable where
  S a slice-from: b to: b -> S a

class Semigroup where
  S a + S a -> S a

class Semigroup => Monoid where
  M a empty -> M a

class Functor where
  F a map: (a -> b) -> F b

class Functor => Applicative where
  A a of: a -> A a
  A (a -> b) apply-to: A a -> A b

class Applicative => Chainable where
  C a chain: (a -> C b) -> C b

class Applicative => Alternative where
  A a none -> A a
  A a <|> A a -> A a

class Monoid => Foldable where
  F a fold-right: (a, b -> b) from: b -> b
  F a fold -> Monoid
  F a fold-using: (a -> Monoid) -> Monoid
  F a fold: (b, a -> b) from: b -> b


-- | Data structures  
module Data.Boolean where
  data Boolean = false | true
  deriving Equality, Ordered, Representable, Parseable, Bounded, Enumerable

  a Boolean? -> Boolean
  Boolean && Boolean -> Boolean
  Boolean || Boolean -> Boolean
  not(Boolean) -> Boolean
  Boolean then: (-> b) else: (-> b) -> b


module Data.Char where
  type Char = Int
  deriving Equality, Ordered, Bounded, Representable, Enumerable

  a Char? -> Boolean
  Char is-control? -> Boolean
  Char is-space? -> Boolean
  Char is-lower? -> Boolean
  Char is-upper? -> Boolean
  Char is-alpha? -> Boolean
  Char is-alpha-numeric? -> Boolean
  Char is-digit? -> Boolean
  Char is-octal-digit? -> Boolean
  Char is-hexadecimal-digit? -> Boolean
  Char is-letter? -> Boolean
  Char uppercase -> Char
  Char lowercase -> Char
  Char code -> Int
  Int to-char -> Char

  
module Data.String where
  type String = [Char]
  deriving Equality, Ordered, Representable, Indexable, Sliceable
         , Semigroup, Monoid

  a String? -> Boolean
  String uppercase -> String
  String lowercase -> String
  String trim -> String
  String trim-left -> String
  String trim-right -> String


module Data.List where
  data List = Nil | a :: List
  deriving Equality, Representable, Bounded, Indexable, Sliceable, Container
         , Semigroup, Functor, Applicative, Chainable, Foldable

  a List? -> Boolean


module Data.Vector where
  type Vector
  deriving Equality, Representable, Bounded, Indexable, Sliceable, Container
         , Semigroup, Functor, Applicative, Chainable, Foldable

  a Vector? -> Boolean
  vector: List -> Vector

  
module Data.Set where
  type Set
  deriving Equality, Representable, Indexable, Semigroup, Monoid

  a Set? -> Boolean
  set: List -> Set
  Set put: a -> Set
  Set remove: a -> Set


module Data.Map where
  data MapEntry = Key ~> Value
  type Map
  deriving Equality, Representable, Indexable, Container, Semigroup, Monoid
         , Functor, Applicative, Chainable, Foldable

  a Map? -> Boolean
  map: List -> Map


module Data.Maybe where
  data Maybe = Nothing | a Just
  deriving Equality, Representable, Semigroup, Monoid, Functor, Applicative, Chainable, Foldable, Alternative

  a Maybe? -> Boolean


module Data.Either where
  data Either = a Failure | a Success
  deriving Equality, Representable, Semigroup, Monoid, Functor, Applicative, Chainable, Foldable, Alternative

  a Either? -> Boolean


module Data.Validation where
  data Validation = a Failure | a Success
  deriving Equality, Representable, Semigroup, Monoid, Functor, Applicative, Foldable, Alternative

  a Validation? -> Boolean


module Data.Record where
  data Record = { String -> a }
  deriving Equality, Representable, Indexable, Container, Semigroup, Monoid, Functor, Applicative,
           Chainable, Foldable

  a Record? -> Boolean
  Record clone -> Record
  Record with: Record -> Record
  Record without: [String] -> Record
  Record rename: String to: String -> Record
  Record rename: [(String, String)] -> Record


module Data.Task where
  data Task = ((Either -> Unit) -> Unit) Cleanup: Function
  deriving Representable, Semigroup, Monoid, Functor, Applicative, Chainable, Alternative

  a Task? -> Boolean
  task: Function -> Task
  task: Function cleanup: Function -> Task
  fail: a -> Task
  Task run: (a -> Unit) recover: (b -> Unit) -> Unit
  Task run: (a -> Unit) -> Unit
  

module Data.Stream where
  -- <TODO>


module Data.Queue where
  -- <TODO>


module Data.Deque where
  -- <TODO>


module Data.Stack where
  -- <TODO>


module Data.Date where
  -- <TODO>


module Control.Monad where
  [Monad(a)] sequence-with: Monad(a) -> Monad([a])
  Monoid(a) when: Boolean -> Monoid
  Monoid(a) unless: Boolean -> Monoid
  Functor(a) void -> Functor(a)
  Monad(Monad(a)) flatten -> Monad(a)
  (a -> b) lift-to: Monad(a) -> (Monad(a) -> Monad(b))
  (a, b -> c) lift-to: Monad(a) and: Monad(b) -> (Monad(a), Monad(b) -> Monad(c))
  (a, b, c -> d) lift-to: Monad(a) and: Monad(b) and: Monad(c) -> (Monad(a), Monad(b), Monad(c) -> Monad(d))
  (a, b, c, d -> e) lift-to: Monad(a) and: Monad(b) and: Monad(c) and: Monad(d) -> (Monad(a), Monad(b), Monad(c), Monad(d) -> Monad(e))


module Concurrency.Asyc where
  never -> Task
  [Task(a, b)] sequentially -> Task(a, [b])
  [Task(a, b)] parallel -> Task(a, [b])
  Task(a, b) or: Task(a, b) -> Task(a, b)
  [Task(a, b)] choose-first -> Task(a, b)
  [Task(a, b)] try-all -> Task([a], b)


module Concurrency.Timer where
  -- <TODO>


module Concurrency.Channel where
  -- <TODO>


module Debug.Trace where
  -- <TODO>


module Io.Console where
  Representable display -> Task(_, Unit)
  Representable display-error -> Task(_, Unit)
  Representable display-warning -> Task(_, Unit)
  Representable display-info -> Task(_, Unit)
  String write -> Task(_, Unit)
  String get-line -> Task(_, String)
  

module Io.FileSystem where
  -- <TODO>


module Io.Process where
  -- <TODO>


module Io.Shell where
  -- <TODO>


module Io.Zip where
  -- <TODO>


module Io.Crypto where
  -- <TODO>


module Web.Http where
  -- <TODO>


module Web.Uri where
  -- <TODO>


module Web.Server where
  -- <TODO>


module Database.MySql where
  -- <TODO>


module Database.Redis where
  -- <TODO>


module Database.Sqlite3 where
  -- <TODO>


module Language.Parsing where
  -- <TODO>


module Language.Json where
  -- <TODO>


module Language.Html where
  -- <TODO>


module Language.Sql where
  -- <TODO>


module Test.QuickCheck where
  -- <TODO>
