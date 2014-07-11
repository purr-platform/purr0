// Copyright (c) 2014 Quildreen Motta <quildreen@gmail.com>
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation files
// (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/**
 * The REPL module.
 *
 * @module purr/repl
 */

var purr     = require('./index');
var Parser   = require('./parser').Parser;
var fs       = require('fs');
var vm       = require('vm');
var readline = require('readline');
var colours  = require('chalk');
var path     = require('path');

var faded  = colours.gray;
var error  = colours.red;
var result = colours.cyan;

module.exports = repl
function repl(loadPaths, prelude) {
  console.log('Type :quit to exit (or ^D).');
  var c = replContext(loadPaths);
  var context = c.context;
  var module = c.module;
  loadPrelude(prelude, context);

  console.log('');
  loopEvaluation(module, context, readline.createInterface({ input: process.stdin, output: process.stdout }));
}

function replContext(loadPaths) {
  var runtime = require('../runtime/repl.js');
  runtime.$lookupPaths = loadPaths.concat([path.join(__dirname, '../Platform')]);
  runtime.$moduleCache = {};
  runtime.$load = purr.$require.bind(runtime);
  runtime.$exports = runtime.$clone();

  var context = vm.createContext({
    process: process,
    console: console,
    require: require,
    setImmediate: setImmediate,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    self: runtime,
    $$package: '<repl>',
    $$Purr: runtime,
    __dirname: process.cwd()
  });
  return { context: context, module: runtime }
}

function loadPrelude(prelude, context) {
  try {
    var module = { exports: { } };
    context.module = module;
    runProgram(context, purr(prelude), prelude);
    context.module = { exports: { } };
    context.$$Purr.$doImport(module.exports(context.self.$exports));
    console.log(faded('*** Loaded the Prelude from: ' + prelude));
  } catch(e) {
    console.log(error('*** Unable to read the Prelude from: ' + prelude));
    console.log(error(e));
  }
}

function loopEvaluation(module, context, rl) {
  rl.question('> ', function(program) {
    finishReplLoop(module, context, rl, program)
  })
}

function finishReplLoop(module, context, rl, program) {
  evaluateCommand(module, context, rl, program)
  loopEvaluation(module, context, rl)
}

function continueRepl(err, module, context, rl, program) {
  rl.question('... ', function(newProgram) {
    if (!newProgram.trim()) {
      console.log(error(err));
      console.log(faded(err.stack));
      loopEvaluation(module, context, rl)
    } else {
      finishReplLoop(module, context, rl, program + '\n' + newProgram)
    }
  })
}

function evaluateCommand(module, context, rl, program) {
  return program === ':quit'?  process.exit(0)
  :      /* otherwise */       maybeLog(module, run(module, context, rl, program))
}

function maybeLog(module, a) {
  if (a != null)  console.log(faded('=>'), result(show(module, a)))
}

function show(module, a) {
  try {
    var impl = module.$getImplementation(module.$protocols['<#Representable:Purr.Core>'], a);
    return impl['to-string'](a)
  } catch(e) {
    return module.$describe(a)
  }
}

function run(module, context, rl, program) {
  if (!(program || '').trim())  return;
  
  try {
    var ast = Parser.matchAll(program.trim(), 'replDecl')
  } catch (e) {
    return continueRepl(e, module, context, rl, program)
  }

  try {
    var code = purr.compile(ast);
    var js   = purr.generate(code);
console.log(faded(js));
  } catch(e) {
    console.log(error(e));
    console.log(faded(e.stack))
  }

  try {
    return runProgram(context, js)
  } catch(e) {
    console.log(error(e));
    console.log(faded(e.stack));
  }
}

function runProgram(context, program, filename) {
  var result = vm.runInNewContext(program, context, filename || '<repl>');
  context.self = context.$$Purr;
  return result;
}
