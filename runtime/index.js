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
 * The Phemme runtime environment.
 *
 * @module phemme/runtime
 */
var $Phemme = {}

void
function(root) {

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

  // -- Namespaces -----------------------------------------------------
  root.Namespace = Object.create(null)
  root.Namespace.clone = function() {
    return Object.create(this)
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

}($Phemme)

