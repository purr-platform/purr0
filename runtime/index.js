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

var $Phemme = module.exports = {}

// -- Helpers --------------------------------------------------------
var proto   = Object.getPrototypeOf
var clone   = Object.create
var hasProp = Object.hasOwnProperty


// IDs for data tags.
var newTag = new function() {
  var index = 0;
  return function(type) {
    return '<#' + type.$$name + ':' + (++index).toString(16) + '>'
  }
}

function tagFor(type) {
  return type == null?    '<nil>'
  :      type.$$tag?      type.$$tag
  :      /* otherwise */  typeof type
}

function describe(value) {
  return tagFor(value) === 'number'?   value
  :      tagFor(value) === 'string'?   JSON.stringify(value)
  :      tagFor(value) === 'boolean'?  value
  :      value.show?                   value.show(value)
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
      type + " doesn't implement all requisites of " + proto.$$name + ".\n"
    + "Missing methods: " + missing.join(", ")
    )
}

function checkParents(proto, type) {
  proto.$parents.forEach(function(a) {
    if (!(type in a.$impl))
      throw new TypeError(
        "No implementation of the required interface " + a.$$name
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
      proto.$$name + " can't extend " + base.$$name + " because the "
    + "following requirements conflict: " + conflicts.join(', ')
    )
}

function listToArray(xs) {
  var result = []
  while (xs.$$ctag != 'Nil') {
    if (xs.$$ctag == '::') {
      result.push(xs.$0)
      xs = xs.$1
    } else {
      throw new TypeError('Not a List: ' + xs)
    }
  }
  return result
}

function ensureString(a) {
  if (typeof a !== 'string')
    throw new TypeError('Not a String value: ' + a)
  return a
}

// -- Utilities ------------------------------------------------------
var unsafeExtend = $Phemme.$destructiveExtend = function(a, b) {
  for (var k in b)
    if (!(/^$/.test(k) || b[k] == null))  a[k] = b[k]

  return a
}

$Phemme.doExport = function(target, name, source, unpack) {
  if (unpack)
    return unsafeExtend(target, source().$namespace())
  else
    return target[name] = source
}

// -- Extensible records ---------------------------------------------
var Record = $Phemme.Record = clone(null)
Record.$fields = clone(null)
Record.$add = function(name, value) {
  ensureString(name)
  if (this.$fields[name] != null)
    throw new TypeError(
      name + " conflicts with an existing binding in the namespace.\n"
      + "  Original: " + this.$fields[name] + "\n"
      + "  New: " + value
    )

  this.$fields[name] = value
  return value
}
Record.$get = function(name) {
  if (/^$/.test(name) || this.$fields[name] == null)
    throw new ReferenceError('No such method: ' + name)

  return this.$fields[name]
}
Record.$namespace = function() {
  return this.$fields
}
Record.$fromObject = function(obj) {
  var result = clone(this)
  result.$fields = clone(null)
  unsafeExtend(result.$fields, obj)
  return result
}

var ExtRecord = $Phemme.ExtRecord = clone(Record)
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
  result.$fields = clone(result.$fields)
  unsafeExtend(result.$fields, data)
  return result
}
ExtRecord['without:'] = function(self, names) {
  var result = clone(self)
  result.$fields = unsafeExtend(clone(null), result.$fields)
  listToArray(names).forEach(function(name) {
    ensureString(name)
    delete result.$fields[name]
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

// -- Namespaces -----------------------------------------------------
var NS = $Phemme.Namespace = Object.create(ExtRecord)

NS['doc:'] = function(_, text){ return function(data) {
  data.$doc = text
  return data
}}
NS.doc = function(data) {
  return data.$doc || '(No documentation available)'
}
NS["print"] = function(arg) {
  console.log(arg)
}
NS.Number   = function(){ return { $$tag: 'number'   } }
NS.String   = function(){ return { $$tag: 'string'   } }
NS.Function = function(){ return { $$tag: 'function' } }
NS.Boolean  = function(){ return { $$tag: 'boolean'  } }


// -- Protocols ------------------------------------------------------
$Phemme.Protocol = Protocol
function Protocol(name) {
  this.$impl     = {}
  this.$defaults = {}
  this.$required = []
  this.$parents  = []
  this.$methods  = {}
  this.$$name    = name
}

Protocol.prototype.$$tag = newTag({ $$name: 'Protocol' })

Protocol.prototype.$add = function(type, impl) {
  var base = unsafeExtend({}, this.$defaults)
  var obj  = unsafeExtend(base, impl)
  checkRequisites(this, obj, tagFor(type))
  checkParents(this, tagFor(type))

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

Protocol.prototype.$getImplementation = function(type) {
  var tag  = tagFor(type)
  var impl = this.$impl[tag]
  if (!impl)
    throw new TypeError(
      'No available implementations of ' + this.$$name + ' for: ' + tag
    )

  return impl
}

Protocol.prototype.$derivation = function() {
  throw new Error(this.$$name + ' does not support automatic derivation.')
}

Protocol.prototype.$extend = function(base) {
  checkConflicts(this, base)
  this.$parents.push(base)
}

Protocol.prototype.$namespace = function() {
  return this.$methods
}

// -- ADTs -----------------------------------------------------------
$Phemme.ADT = ADT
function ADT(name) {
  this.$$name  = name
  this.$$tag   = newTag(this)
  this.$sealed = false
  this.$ctors  = {}
}

ADT.prototype.$add = function(tag, ctor) {
  if (this.sealed)
    throw new Error('Trying to add a constructor to the sealed AST ' + this.$$name)

  ctor.prototype = Object.create(this)
  ctor.prototype.$$name = this.$$name + "." + tag
  ctor.prototype.$$ctag = tag
  this[tag] = makeFn(ctor.length, ctor)
  this.$ctors[tag] = this[tag]
}

ADT.prototype.$get = function(name) {
  if (this.$ctors[name] == null)
    throw new ReferenceError('No constructor "' + name + '" for ' + this.$$name)
  return this[name]
}

ADT.prototype.$seal = function() {
  this.$sealed = true
}

ADT.prototype.$namespace = function() {
  return this.$ctors
}