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
 * @module phemme
 */

var read      = require('fs').readFileSync;
var path      = require('path');
var vm        = require('vm');
var escodegen = require('escodegen');
var esprima   = require('esprima');
var Parser    = require('./parser').Parser;
var Compiler  = require('./compiler').Compiler;

var doSource = exports = module.exports = function(program) {
  return generate(compile(parse(program)))
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
  var code    = read(file, 'utf-8');
  var source  = doSource(code);
  var module  = { exports: { } };

  var context = vm.createContext({ process: process
                                 , console: console
                                 , require: require
                                 , __dirname: path.dirname(path.resolve(file))
                                 , __file: file
                                 , $Phemme: rt
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
  var rt = runtime(file)
  rt.$rootPackage = path.dirname(file)
  rt.$packageMap  = { 'Phemme.Core': path.join(__dirname, '../phemme/base.phemme') }
  return run(file, rt)(rt).$main()
}

function $require(module, dir) {
  if (module in this.$packageMap)
    var file = this.$packageMap[module]
  else
    var file = path.join(this.$rootPackage, module.replace(/\./g, '/') + '.phemme')
  return run(file, this)
}

function makeModule(dir, code) {
  dir  = JSON.stringify(dir);
  code = escodegen.generate(esprima.parse(code));
  return '(function(__dirname) {'
       + code
       + '}(' + dir + '))'
}
