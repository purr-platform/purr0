// -- Phemme runtime environment ---------------------------------------
var $Phemme = global.$Phemme || {}
void function() {
  if ($Phemme.Namespace)  return

  // -- Helpers --------------------------------------------------------

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

  $Phemme.ensureBoolean = function(a) {
    if (typeof a !== 'boolean')
      throw new TypeError('Not a Boolean value: ' + a)
    return a
  }

  $Phemme.ensureNumber = function(a) {
    if (typeof a !== 'number')
      throw new TypeError('Not a Number value: ' + a)
    return a
  }

  $Phemme.ensureString = function(a) {
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
  var Record = Object.create(null)
  Record.$add = function(name, value) {
    if (this[name] != null)
      throw new TypeError(
        name + " conflicts with an existing binding in the namespace.\n"
        + "  Original: " + this[name] + "\n"
        + "  New: " + value
      )

    this[name] = value
    return value
  }
  Record.$get = function(name) {
    if (/^$/.test(name) || this[name] == null)
      throw new ReferenceError('No such method: ' + name)

    return this[name]
  }
  Record.$namespace = function() {
    return this
  }
  Record.$fromObject = function(obj) {
    return unsafeExtend(Object.create(this), obj)
  }

  var ExtRecord = Object.create(Record)
  ExtRecord['at:'] = function(self, name) {
    return self.$get(name)
  }
  ExtRecord.clone = function(self) {
    return Object.create(self)
  }
  ExtRecord['with:'] = function(self, otherRecord) {
    var result = Object.create(self)
    var data   = otherRecord.$namespace()
    return unsafeExtend(result, data)
  }
  ExtRecord['without:'] = function(self, names) {
    var result = Object.create(self)
    listToArray(names).forEach(function(name) {
      result[name] = null
    })
    return result
  }
  ExtRecord['rename:to:'] = function(self, origin, newName) {
    var newObj = Object.create(Record)
    newObj[newName] = self[origin]
    return self['without:'](self, origin)
               ['with:'](self, newObj)
  }
  ExtRecord['rename:'] = function(self, names) {
    var result = Object.create(self)
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

}()
global.$Phemme = $Phemme
// -- End of the Phemme's runtime environment --------------------------
