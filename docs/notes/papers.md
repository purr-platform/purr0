This document lists a series of papers that serve as inspiration for the
design of Purr and its programming platform (Mermaid). For more specific
papers and references, please see each specific document.

- [F-ing Modules](https://www.mpi-sws.org/~rossberg/f-ing/)
  : Andreas Rossberg, Claudio Russo, Derek Dreyer

  Mostly semantics for modules.
  

- [The Newspeak Programming Platform](http://bracha.org/newspeak.pdf)
  : Gilad Bracha, Peter von der Ahé, Vassili Bykov, Yaron Kashai, and
  Eliot Miranda

  Newspeak is a major inspiration for Purr. The decision of not having a
  global namespace, and instead going with first-class parametric
  modules started from here. Newspeak also informs other aspects of
  Purr, like FFI, and data abstractions.


- [Programming as an Experience: The Inspiration for Self](http://bibliography.selflanguage.org/programming-as-experience.html)
  : Randall B. Smith, and David Ungar

  Describes the Self system and its goals. Purr aims for similar goals
  in terms of programming experience (see the
  [Design Constraints](design-questions.md) document for more details).


- [Out of the Tar Pit](http://shaffner.us/cs/papers/tarpit.pdf)
  : Ben Moseley, Peter Marks

  Addresses complexity in software development, specially with OOP and
  mutability, which we want to avoid.


- [Monads for Functional Programming](http://homepages.inf.ed.ac.uk/wadler/papers/marktoberdorf/baastad.pdf)
  : Philip Wadler

  Monads have their own set of awful problems, but they still work
  reasonably well for sequencing computations. They also make dealing
  with concurrency simpler by using combinators.


- [Haskell '98 Language and Libraries - The Revised Report](https://www.haskell.org/onlinereport/)
  : Simon Peyton Jones

  Haskell is still one of the major influences on Purr, although
  they use different execution models.


- [Lowering the Barriers to Programming: a survey of programming environments and languages for novice programmers](https://www.cs.cmu.edu/~caitlin/papers/NoviceProgSurvey.pdf)
  : Caitlin Kelleher, Randy Pausch

  Purr wants to make programming easy for programmers, and possible for
  non-programmers. It's important to be aware of existing efforts on
  such front.


- [Behavioral Software Contracts](http://www.eecs.northwestern.edu/~robby/pubs/papers/behavioral-software-contracts.pdf)
  : Robert Findler

  Contracts (which includes further work with Felleisen and Wadler on
  Blame Calculus and higher-order/dependent contracts) are one of the
  foundations of Purr's correctness checks.


- [QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs](http://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf)
  : Koen Claessen, John Hughes

  Property-based tests are used for additional interface constraints in
  Purr, and can be embedded in implementations of
  interfaces. Example-based tests can also be added, but they're simpler
  and more well-known.



