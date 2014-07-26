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

function showError(e, options) {
  console.log(error(e));
  if (options.verbose) console.log(faded(e.stack));
}

module.exports = repl
function repl(loadPaths, prelude, options) {
  console.log('Type :quit to exit (or ^D).');
  var c = replContext(loadPaths);
  var context = c.context;
  var module = c.module;
  loadPrelude(prelude, context, options);

  console.log('');
  loopEvaluation( module
                , context
                , readline.createInterface({ input: process.stdin, output: process.stdout })
                , options);
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
  return { context: context, module: runtime };
}

function loadPrelude(prelude, context, options) {
  try {
    var module = { exports: { } };
    context.module = module;
    runProgram(context, purr(prelude), prelude);
    context.module = { exports: { } };
    context.$$Purr.$doImport(module.exports['Prelude'](context.self.$exports));
    console.log(faded('*** Loaded the Prelude from: ' + prelude));
  } catch(e) {
    console.log(error('*** Unable to read the Prelude from: ' + prelude));
    showError(e, options);
  }
}

function loopEvaluation(module, context, rl, options) {
  rl.question('> ', function(program) {
    finishReplLoop(module, context, rl, program, options);
  });
}

function finishReplLoop(module, context, rl, program, options) {
  evaluateCommand(module, context, rl, program, options);
}

function continueRepl(err, module, context, rl, program, options) {
  rl.question('... ', function(newProgram) {
    if (!newProgram.trim()) {
      showError(err, options);
      loopEvaluation(module, context, rl, options);
    } else {
      finishReplLoop(module, context, rl, program + '\n' + newProgram, options);
    }
  });
}

function evaluateCommand(module, context, rl, program, options) {
  return program === ':quit'?  process.exit(0)
  :      /* otherwise */       run(module, context, rl, program, options)
}

function maybeLog(module, a) {
  if (a != null)  console.log(faded('=>'), faded('(' + module.$tag(a) + ')'), result(show(module, a)));
}

function show(module, a) {
  try {
    var impl = module.$getImplementation(module.$protocols['<#To-String:Purr.Core>'], a);
    return impl['to-string'](a);
  } catch(e) {
    console.log(e)
    return module.$describe(a);
  }
}

function run(module, context, rl, program, options) {
  if (!(program || '').trim())  return;
  
  try {
    var ast = Parser.matchAll(program.trim(), 'replDecl');
  } catch (e) {
    return continueRepl(e, module, context, rl, program, options);
  }

  try {
    var code = purr.compile(ast);
    var js   = purr.generate(code);
    if (options.showJs)  console.log(faded(js));
  } catch(e) {
    showError(e, options);
  }

  try {
    var result = runProgram(context, js);
    if (options.runIO && result && result.$$tag === '<#Task:Io.Task>') {
      context.$$Purr.$runIO(result, function(error, result) {
        if (error) {
          showError(e, options);
        } else {
          maybeLog(module, result);
          loopEvaluation(module, context, rl, options);          
        }
      });
    } else {
      maybeLog(module, result);
      loopEvaluation(module, context, rl, options);
    }
  } catch(e) {
    showError(e, options);
    loopEvaluation(module, context, rl, options);
  }
}

function runProgram(context, program, filename) {
  var result = vm.runInNewContext(program, context, filename || '<repl>');
  context.self = context.$$Purr;
  return result;
}
