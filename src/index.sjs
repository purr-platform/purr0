// Copyright (c) 2014 Quildreen Motta
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
 * A small, portable functional language for writing highly concurrent web servers.
 *
 * @module purr
 */

var fs        = require('fs')
var read      = fs.readFileSync;
var path      = require('path');
var vm        = require('vm');
var escodegen = require('escodegen');
var esprima   = require('esprima');
var Parser    = require('./parser').Parser;
var Compiler  = require('./compiler').Compiler;

var doSource = exports = module.exports = function(file) {
  var program = read(file, 'utf-8');
  try {
    return generate(compile(parse(program)))
  } catch (e) {
    throw new Error('Failed to compile the file: ' + file + '\n\nReason: ' + e.stack)
  }
};

exports.parse = parse;
function parse(text) {
  return Parser.matchAll(text, 'program')
}

exports.compile = compile;
function compile(ast) {
  return Compiler.match(ast, 'cc')
}

exports.generate = generate;
function generate(ast) {
  return escodegen.generate(ast)
}

exports.run = run;
function run(file, rt) {
  var source  = doSource(file);
  var module  = { exports: { } };

  var context = vm.createContext({ process: process
                                 , console: console
                                 , require: require
                                 , setImmediate: setImmediate
                                 , setTimeout: setTimeout
                                 , clearTimeout: clearTimeout
                                 , __dirname: path.dirname(path.resolve(file))
                                 , __file: file
                                 , $Purr: rt
                                 , module:  module });
  vm.runInNewContext(source, context, file)
  return module.exports
}

function runtime(file) {
  var runtime   = require('../runtime');
  runtime.$load = $require.bind(runtime);
  return runtime
}

exports.runFile = runFile
function runFile(file) {
  var rt = runtime(file);
  rt.$lookupPaths = [path.dirname(file), path.join(__dirname, '../Platform')];
  rt.$moduleCache = { };
  return run(file, rt)(rt).$main()
}

function $require(module, dir) {
  if (module in this.$moduleCache)
    return this.$moduleCache[module];

  var file     = module.replace(/\./g, '/') + '.purr';
  var fullPath = null
  for (var i = 0; i < this.$lookupPaths.length; ++i) {
    fullPath = path.join(this.$lookupPaths[i], file);
    if (!fs.existsSync(fullPath))  fullPath = null
    else                           break
  }
  if (!fullPath)  throw new Error("Couldn't find the module: " + module);
  return this.$moduleCache[module] = run(fullPath, this)
}

function makeModule(dir, code) {
  dir  = JSON.stringify(dir);
  code = escodegen.generate(esprima.parse(code));
  return '(function(__dirname) {'
       + code
       + '}(' + dir + '))'
}
