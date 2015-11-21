<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Design Questions and Constraints](#design-questions-and-constraints)
- [What is Purr?](#what-is-purr)
- [Constraints for specific areas](#constraints-for-specific-areas)
  - [Workflow](#workflow)
  - [Safety / Correctness](#safety--correctness)
  - [Environment](#environment)
  - [Evolution](#evolution)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Design Questions and Constraints

Questions and constraints that move the design of Purr forward are documented
here.

# What is Purr?

Purr is a functional programming langauge designed for writing safe
concurrent applications, as an alternative to things like PHP. However,
it's also a general-purpose programming platform.

In essence, Purr must provide at least the following:

- An efficient workflow for iterative development (attractive for one
  who'd write PHP);

- To be perceived as "easy" by programmers and non-programmers, while
  not sacrificing simplicity;

- Enforce compositional constraints, in a way that it's possible to
  explain to the user WHY constraints fail, in context, and debuggable
  with the same tools used for debugging runtime errors;

- Enforce safety in usage of external languages (HTML, SQL) while
  providing similar syntax to avoid having people learn entirely new
  APIs;

- Support concurrency in an "easy" way. People shouldn't need to worry
  about concurrent accesses to data structures, in general, where
  possible;

- Failures should be simple to reason about (this rules out dynamic
  exceptions);

- Having a fully reflective and explorable programming environment;

- Avoid forcing people to rely on non-natural idioms because of language
  limitations where possible (e.g.: support mutually recursive
  dependencies so people don't need to work around it with awkward
  idioms);


# Constraints for specific areas

## Workflow

- It should be possible for someone to change part of the system, while it's
  running, and see their changes right away, without any restart, data or state
  loss. This takes care of providing a workflow like PHP's.

- It should be possible for someone to test different changes. Essentially, this
  would require the system to act like a VCS specifically for program
  components, allowing safe experimentation in branches and rollbacks.


## Safety / Correctness

- It should only be possible for someone to do something they're explicitly
  given access to. (OCS)

- Code should follow from data shapes.

- Components should program to interfaces, not concrete representations
  (future-proofing).


## Environment

- How do you attach rich meta-data to every object in a user-definable way
  without running a turing-complete program?


## Evolution

- There should be language support for evolving it (by the user, and by the
  language itself).
