// -- Phemme runtime environment ---------------------------------------
var $Phemme = global.$Phemme || {}
void function() {
  if ('$Phemme' in global)  return

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

  // -- Namespaces -----------------------------------------------------
  var NS = $Phemme.Namespace = Object.create(null)

  NS.$add = function(name, value) {
    if (name in this)
      throw new TypeError(
        name + " conflicts with an existing binding in the namespace.\n"
        + "  Original: " + this[name] + "\n"
        + "  New: " + value
      )

    this[name] = value
    return value
  }
  NS.load = function(path) {
    var module = require(path)
    return 'default' in module?  module['default']()
    :      /* otherwise */       module
  }
  NS.clone = function(a) {
    return Object.create(a)
  }
  NS["print"] = function(arg) {
    console.log(arg)
  }
  NS.Number   = function(){ return { $$tag: 'number'   } }
  NS.String   = function(){ return { $$tag: 'string'   } }
  NS.Function = function(){ return { $$tag: 'function' } }
  NS.Boolean  = function(){ return { $$tag: 'boolean'  } }

  // -- Utilities ------------------------------------------------------
  var unsafeExtend = $Phemme.$destructiveExtend = function(a, b) {
    for (var k in b) {
      a[k] = b[k]
    }
    return a
  }

  // -- Protocols ------------------------------------------------------
  $Phemme.Protocol = Protocol
  function Protocol(name) {
    this.$impl     = {}
    this.$defaults = {}
    this.$required = []
    this.$parents  = []
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
    return fn
  }

  Protocol.prototype.$addDefault = function(key, fn) {
    this.$defaults[key] = fn
  }

  Protocol.prototype.$get = function(type) {
    var tag  = tagFor(type)
    var impl = this.$impl[tag]
    if (!impl)
      throw new TypeError(
        'No available implementations of ' + this.$$name + ' for: ' + tag
      )

    return impl
  }

  Protocol.prototype.$extend = function(base) {
    checkConflicts(this, base)
    this.$parents.push(base)
  }

  // -- ADTs -----------------------------------------------------------
  $Phemme.ADT = ADT
  function ADT(name) {
    this.$$name  = name
    this.$$tag   = newTag(this)
    this.$sealed = false
  }

  ADT.prototype.$add = function(tag, ctor) {
    if (this.sealed)
      throw new Error('Trying to add a constructor to the sealed AST ' + this.$$name)

    ctor.prototype = Object.create(this)
    ctor.prototype.$$name = this.$$name + "." + tag
    ctor.prototype.$$ctag = tag
    this[tag] = makeFn(ctor.length, ctor)
  }

  ADT.prototype.$seal = function() {
    this.$sealed = true
  }

}()
global.$Phemme = $Phemme
// -- End of the Phemme's runtime environment --------------------------
