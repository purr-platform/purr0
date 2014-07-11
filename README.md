Purr
====

<img
src="https://raw.githubusercontent.com/robotlolita/purr/master/purr-tan.png" align="right">

Purr is a small functional language designed for writing concurrent
web-servers. It focuses on ease of development, security and concurrency.

(See the [Rationale](https://github.com/robotlolita/purr/wiki/Rationale) page
for more details)

> **NOTE**
>
> The language is still in **REALLY EARLY STAGES** of development. While it's
> usable, there's absolutely no optimisations in the compiler whatsoever, and
> the standard library and tooling are lacking many features. Do note also that
> the language is constantly changing at this stage.


## Getting started

You'll need to clone the repository, install the dependencies, and compile the
Sweet.js/OMeta files (you'll need Make, and Node properly installed).

```shell
$ git clone git://github.com/robotlolita/purr.git
$ cd purr
$ npm install
$ make all
$ bin/ipurr
Type :quit to exit (or ^D).
*** Loaded the Prelude from: /home/queen/Projects/PLs/purr/Platform/Prelude.purr

> "Hello, world"
"Hello, world"
```

To run files, use the `purr` command:

```shell
$ bin/purr some-file.purr
```

## Resources

  - [The Wiki](https://github.com/robotlolita/purr/wiki) has some information on the project.
  - [The Gitter chat](https://gitter.im/robotlolita/purr) is used for discussing project-related things.
