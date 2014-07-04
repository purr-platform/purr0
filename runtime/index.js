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

// -- Helpers --------------------------------------------------------
var equal   = require('deep-equal')
var proto   = Object.getPrototypeOf
var clone   = Object.create
var hasProp = Object.hasOwnProperty


// IDs for data tags.
var newTag = new function() {
  var index = 0;
  return function(type, file) {
    return '<#' + type.$$name + ':' + file + '>'
  }
}

function tagFor(type) {
  return type == null?    '<nil>'
  :      type.$$tag?      type.$$tag
  :      /* otherwise */  typeof type
}

function parseName(name) {
  return name.replace(/\$(\d+)_/g, function(_, m) { return String.fromCharCode(m) })
}

function describeFn(fn) {
  return '<function:' + fnName(fn) + '>'
}

function fnName(fn) {
  return fn.name? parseName(fn.name.slice(1)) : '(anonymous)'
}

function describe(value) {
  return tagFor(value) === 'number'?   value
  :      tagFor(value) === 'string'?   JSON.stringify(value)
  :      tagFor(value) === 'boolean'?  value
  :      typeof value === 'function'?  describeFn(value)
  :      /* otherwise */               tagFor(value)
}

function makeFn(n, Ctor) {
  var args = Array.apply(null, Array(n)).map(function(_,i){
    return String.fromCharCode(i + 97)
  })
  return new Function( 'Ctor'
                     , 'return function(' + args.join(', ') + ') {'
                     + '  return new Ctor(' + args.join(', ') + ')'
                     + '}'
                     )(Ctor)
}

function checkRequisites(proto, o, type) {
  var implemented = Object.keys(o).sort()
  var missing = proto.$required.filter(function(a) {
                  return implemented.indexOf(a) === -1
                })
  if (missing.length)
    throw new TypeError(
      type + " doesn't implement all requisites of " + proto.$$tag + ".\n"
    + "Missing methods: " + missing.join(", ")
    )
  var extraneous = implemented.filter(function(a) {
                     return proto.$required.indexOf(a) === -1
                   })
  if (extraneous.length)
    throw new TypeError(
      type + " provides methods that are not defined by " + proto.$$tag + ".\n"
    + "Extraneous methods: " + extraneous.join(", ")
    )
}

function checkParents(proto, type) {
  proto.$parents.forEach(function(a) {
    if (!(type in a.$impl))
      throw new TypeError(
        "No implementation of the required interface " + a.$$tag
      + " was found for " + type + "."
      )
  })
}

function checkConflicts(proto, base) {
  var reqs = proto.$required
  var imp  = base.$required
  var conflicts = imp.filter(function(a) {
    return reqs.indexOf(a) !== -1
  })
  if (conflicts.length)
    throw new TypeError(
      proto.$$tag + " can't extend " + base.$$tag + " because the "
    + "following requirements conflict: " + conflicts.join(', ')
    )
}

function listToArray(xs) {
  var result = []
  while (xs.$$ctag != 'Nil') {
    if (xs.$$ctag == '::') {
      result.push(xs.$$0)
      xs = xs.$$1
    } else {
      throw new TypeError('Not a List: ' + xs)
    }
  }
  return result
}

function each(obj, f) {
  Object.keys(obj).forEach(function(k) {
    if (!/^\$/.test(k))  f(k, obj[k])
  })
}

function ensureString(a) {
  if (typeof a !== 'string')
    throw new TypeError('Not a String value: ' + a)
  return a
}

// -- Utilities ------------------------------------------------------
function unsafeExtend(a, b) {
  for (var k in b)
    if (!(/^\$/.test(k) || b[k] == null))  a[k] = b[k]

  return a
}

function mergeProtocols(a, b) {
  var source = b.$_protocols
  var target = a.$_protocols
  Object.keys(source).forEach(function(p) {
    if (p in target)  target[p].$merge(source[p])
    else target[p] = source[p]
  })
}

// -- Extensible records ---------------------------------------------
var Record = clone(null)
Record.$add = function(name, value) {
  ensureString(name)
  if (hasProp.call(this, name) && this[name] != null)
    throw new TypeError(
      name + " conflicts with an existing binding in the namespace.\n"
      + "  Original: " + this[name] + "\n"
      + "  New: " + value
    )

  this[name] = value
  return value
}
Record.$get = function(name) {
  if (/^\$/.test(name) || this[name] == null)
    throw new ReferenceError('No such method: ' + name)

  return this[name]
}
Record.$namespace = function() {
  return this
}
Record.$fromObject = function(obj) {
  var result = clone(this)
  unsafeExtend(result, obj)
  return result
}
Record.$clone = function() {
  return clone(this)
}

var ExtRecord = clone(Record)
ExtRecord['at:put:'] = function(self, name, value) {
  ensureString(name)
  var result = clone(self)
  return result.$add(name, value)
}
ExtRecord['at:'] = function(self, name) {
  ensureString(name)
  return self.$get(name)
}
ExtRecord.clone = function(self) {
  return clone(self)
}
ExtRecord['with:'] = function(self, otherRecord) {
  var result = clone(self)
  var data   = otherRecord.$namespace()
  unsafeExtend(result, data)
  return result
}
ExtRecord['without:'] = function(self, names) {
  var result = clone(self)
  listToArray(names).forEach(function(name) {
    ensureString(name)
    result[name] = null
  })
  return result
}
ExtRecord['rename:to:'] = function(self, origin, newName) {
  var newObj = Record.$fromObject({})
  newObj.$add(newName, self.$get(origin))
  return self['without:'](self, origin)
             ['with:'](self, newObj)
}
ExtRecord['rename:'] = function(self, names) {
  var result = clone(self)
  listToArray(names).forEach(function(xs) {
    var pair = listToArray(xs)
    result = result['rename:to:'](self, pair[0], pair[1])
  })
  return result
}

// -- Protocols ------------------------------------------------------
function Protocol(name, pkg) {
  this.$impl     = {}
  this.$defaults = {}
  this.$required = []
  this.$parents  = []
  this.$methods  = {}
  this.$$name    = name
  this.$$tag     = newTag(this, pkg)
}

Protocol.prototype.$$tag = newTag({ $$name: 'Protocol' }, '<builtin>')

Protocol.prototype.$add = function(type, impl) {
  var base = unsafeExtend({}, this.$defaults)
  var obj  = unsafeExtend(base, impl)
  checkRequisites(this, obj, tagFor(type))

  this.$impl[tagFor(type)] = obj
}

Protocol.prototype.$require = function(key, fn) {
  this.$required.push(key)
  this[key] = fn
  this.$methods[key] = fn
  return fn
}

Protocol.prototype.$get = function(name) {
  if (this.$methods[name] == null)
    throw new ReferenceError('No such method: ' + name)
  return this[name]
}

Protocol.prototype.$addDefault = function(key, fn) {
  this.$defaults[key] = fn
}

Protocol.prototype.$derivation = function() {
  throw new Error(this.$$tag + ' does not support automatic derivation.')
}

Protocol.prototype.$extend = function(base) {
  checkConflicts(this, base)
  this.$parents.push(base)
}

Protocol.prototype.$namespace = function() {
  return this.$methods
}

Protocol.prototype.$requisites = function() {
  return this.$parents.map(function(p){ return p.$required.slice() })
                      .concat([this.$required.slice()])
                      .reduce(function(xs, ys) {
                         return xs.concat(ys)
                       }, [])
}

Protocol.prototype.$equals = function(another) {
  return this.$$tag === another.$$tag
}

Protocol.prototype.$merge = function(another) {
  if (!(this.$equals(another)))
    throw new Error("Can't unify diverging protocols " + this.$$tag + " and " + another.$$tag)

  var impl = another.$impl
  Object.keys(impl).forEach(function(k) {
    this.$impl[k] = another.$impl[k]
  }.bind(this))
}

Protocol.prototype.$unpack = function(name, target, source) {
  unsafeExtend(target, this.$namespace())
}

// -- ADTs -----------------------------------------------------------
function ADT(name, pkg) {
  this.$$name  = name
  this.$$tag   = newTag(this, pkg)
  this.$sealed = false
  this.$ctors  = {}
}

ADT.prototype.$add = function(tag, ctor) {
  if (this.sealed)
    throw new Error('Trying to add a constructor to the sealed AST ' + this.$$tag)

  ctor.prototype = Object.create(this)
  ctor.prototype.$$name = this.$$name + "." + tag
  ctor.prototype.$$ctag = tag
  this[tag] = makeFn(ctor.length, ctor)
  this.$ctors[tag] = this[tag]
}

ADT.prototype.$get = function(name) {
  if (this.$ctors[name] == null)
    throw new ReferenceError('No constructor "' + name + '" for ' + this.$$tag)
  return this[name]
}

ADT.prototype.$seal = function() {
  this.$sealed = true
}

ADT.prototype.$namespace = function() {
  return this.$ctors
}

ADT.prototype.$unpack = function(name, target, source) {
  unsafeExtend(target, this.$namespace())
  target[name] = source
}

// -- Namespaces -----------------------------------------------------
var NS = Object.create(ExtRecord)

// Internal properties
NS.$destructiveExtend = unsafeExtend
NS.$mergeProtocols    = mergeProtocols
NS.$ExtRecord         = ExtRecord
NS.$Record            = Record
NS.$Protocol          = Protocol
NS.$ADT               = ADT
NS.$protocols         = {}
NS.$tag               = tagFor
NS.$newTag            = newTag
NS.$listToArray       = listToArray
NS.$doImport = function(module, name) {
  if (name)  this[name] = module
  else       unsafeExtend(this, module)
}
NS.$hasImplementation = function(proto, type) {
  return tagFor(type) in this.$protocols[tagFor(proto)].$impl
}
NS.$getImplementation = function(proto, type) {
  var tag    = tagFor(type)
  var $proto = this.$protocols[tagFor(proto)]
  var impl   = $proto.$impl[tag]
  if (!impl)
    throw new TypeError(
      'No available implementations of ' + $proto.$$tag + ' for: ' + tag
    )

  return impl
}
NS.$doExport = function(name, unpack) {
  var source = this[name]
  if (unpack)  source().$unpack(name, this.$exports, source)
  this.$exports[name] = source
}
NS.$makeNamespace = function(pkg) {
  var ns = clone(this)
  ns.$package   = pkg
  ns.$exports   = clone(this)
  ns.$exports.$main = function(xs){
    each(ns.$protocols, function(_, proto) {
      each(proto.$impl, function(tag) {
        checkParents(proto, tag)
      })
    })
    var task = ns.main(xs)
    if (task.$$tag !== '<#Task:Phemme.Data.Task>')
      throw new TypeError('Expected a Task, got: ' + tagFor(task))
    var computation = task.$$0
    var cleanup = task.$$1
    computation(function(val) {
      cleanup()
      if (val.$$ctor === 'Failure') throw val.$$0
    })
  }
  return ns
}
NS.$defProtocol = function(protocol) {
  var tag    = tagFor(protocol)
  var protos = this.$protocols

  if (tag in protos)  protos[tag].$merge(protocol)
  else                protos[tag] = protocol
}
NS.$implementProtocol = function(proto, obj, impl) {
  var protocol = this.$protocols[tagFor(proto)]
  if (!protocol)
    throw new ReferenceError('No protocol ' + tagFor(proto))
  protocol.$add(obj, impl)
}
NS.$checkContract = function f(contract, value, name) {
  if (!contract(value)) {
    var fn = name
    var blame = f.caller.caller
    throw new Error(
      'Contract violation: expected ' + fnName(contract) + ', actual: ' + describe(value)
    + '\nDefined in:  ' + '<function:' + name + '>'
    + '\nBlame is on: ' + describeFn(blame)
    )
  }
}
NS.$checkCoContract = function f(contract, value, name) {
  if (!contract(value)) {
    throw new Error(
      'Contract violation: expected ' + fnName(contract) + ', actual: ' + describe(value)
    + '\nDefined in:  ' + '<function:' + name + '>'
    + '\nBlame is on: ' + '<function:' + name + '>'
    )
  }
}
NS.Number   = function(){ return { $$tag: 'number'   } }
NS.String   = function(){ return { $$tag: 'string'   } }
NS.Function = function(){ return { $$tag: 'function' } }
NS.Boolean  = function(){ return { $$tag: 'boolean'  } }


// -- Exporting --------------------------------------------------------
module.exports = NS
