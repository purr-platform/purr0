<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Design Questions](#design-questions)
  - [Workflow](#workflow)
  - [Safety / Correctness](#safety--correctness)
  - [Environment](#environment)
  - [Evolution](#evolution)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

Design Questions
================

Questions and constraints that move the design of Purr forward are documented
here.


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
