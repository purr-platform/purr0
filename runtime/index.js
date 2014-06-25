// -- Phemme runtime environment ---------------------------------------
var $Phemme = global.$Phemme || {}

if (!('$Phemme' in global)) {
  void function(root) {
  
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
  
    // -- Namespaces -----------------------------------------------------
    root.Namespace = Object.create(null)
    root.Namespace.clone = function(a) {
      return Object.create(a)
    }
    root.Namespace["print"] = function(arg) {
      console.log(arg)
    }
  
    // -- Utilities ------------------------------------------------------
    root.$destructiveExtend = function(a, b) {
      for (var k in b) {
        a[k] = b[k]
      }
      return a
    }
  
  
    // -- Protocols ------------------------------------------------------
    root.Protocol = Protocol
    function Protocol(name) {
      this.$impl = {}
      this.$$name = name
    }
  
    Protocol.prototype.$$tag = newTag({ $$name: 'Protocol' })
  
    Protocol.prototype.$add = function(type, impl) {
      this.$impl[tagFor(type)] = impl
    }
  
    Protocol.prototype.$get = function(type) {
      var tag  = tagFor(type)
      var impl = this.$impl[tag]
      if (!impl)  throw new TypeError( 'No available implementations of ' + this.$$name
                                     + ' for: ' + tag)
      return impl
    }
  
    // -- ADTs -----------------------------------------------------------
    root.ADT = ADT
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
  
  
  }($Phemme)
}
// -- End of the Phemme's runtime environment --------------------------
