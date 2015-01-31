// # module: Purr
//
// A small, portable functional language for writing highly concurrent web servers.
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
function runFile(file, name) {
  var rt = runtime(file);
  rt.$lookupPaths = [path.dirname(file), path.join(__dirname, '../Platform')];
  rt.$moduleCache = { };
  var module = run(file, rt);
  var keys   = Object.keys(module);
  return name?               module[name](rt).$main()
  :      keys.length === 1?  module[keys[0]](rt).$main()
  :      /* otherwise */     module['Main'](rt).$main()
}

exports.$require = $require
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
