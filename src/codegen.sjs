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

// -- Dependencies -----------------------------------------------------
var extend  = require('xtend');
var esprima = require('esprima')

// -- Helpers ----------------------------------------------------------

/**
 * Returns a valid name for JS identifiers.
 *
 * @summary String → String
 */
function sanitiseName(name) {
  return '_' + name.replace(/(\W)/g, function(x) {
                                       return '$' + x.charCodeAt(0) })
}

function flatten(xs) {
  return xs.reduce(function(ys, x) {
    return Array.isArray(x)?  ys.concat(x)
    :      /* otherwise */    ys.concat([x])
  }, [])
}

// -- Base node constructors -------------------------------------------
function node(type, body) {
  return extend({ type: type }, body)
}

function lit(value) {
  return node('Literal', { value: value })
}


function expr(body) {
  return node('ExpressionStatement', { expression: body })
}

function block(body) {
  return node('BlockStatement', { body: body })
}

function ret(value) {
  return node('ReturnStatement', { argument: value })
}

function fn(id, params, body) {
  return node( 'FunctionExpression'
             , { id: id
               , params: params
               , body: block(body)
               , expression: false
               , generator: false })
}

function smember(object, property) {
  return node( 'MemberExpression'
             , { object: object
               , property: property
               , computed: false })
}

function method(object, method, args) {
  return call(member(object, method), args)
}

function array(xs) {
  return node('ArrayExpression', { elements: xs })
}

function obj(xs) {
  return node( 'ObjectExpression'
             , { properties: xs.map(function(x) {
                                      return { key: x.key
                                             , value: x.value
                                             , kind: 'init' }})})
}

function varsDecl(xs) {
  return node( 'VariableDeclaration'
             , { kind: 'var'
               , declarations: xs.map(function(x) {
                                        return node( 'VariableDeclarator'
                                                   , { id  : x[0]
                                                     , init: x[1] })})})
}

function newExpr(callee, args) {
  return node('NewExpression', { callee: callee
                               , arguments: args })
}

function builtin(name) {
  return smember(id("$Phemme"), id(name))
}

function set(what, value) {
  return node('AssignmentExpression', { operator: '='
                                      , left: what
                                      , right: value })
}

function thisExpr() {
  return node('ThisExpression')
}

function prog(body) {
  return node('Program', { body: body })
}

function scoped(expr) {
  return call(
    lambda(null, [id("$scope")], expr),
    [call(smember(id("_self"), id("clone")), [])]
  )
}

function get(name) {
  return member(id("_self"), name)
}

// High-level stuff
exports.number = number;
function number(integer, decimal) {
  return lit(Number(integer + '.' + decimal))
}

exports.string = string;
function string(text) {
  return lit(String(text))
}

exports.letStmt = letStmt;
function letStmt(name, value) {
  return expr(set(get(name), value))
}

exports.module = module;
function module(name, args, body) {
  return letStmt(
    name,
    scoped(
      fn(
        identifier(name.value),
        args,
        [
          varsDecl([[id("$exports"), obj([])]]),
          varsDecl([[id("_self"), id("$scope")]]),
        ].concat(flatten(body))
         .concat([
           ret(id("$exports"))
         ])
      )
    )
  )
}

exports.ifaceStmt = ifaceStmt;
function ifaceStmt(name, decls) {
  return [
    letStmt(name, newExpr(builtin("Protocol"), [name]))
  ].concat(decls.map(makeDecl));

  function makeDecl(pair) {
    var args = pair[1].map(λ(x) -> identifier(x.value));

    return letStmt(
      pair[0],
      set(
        member(get(name), pair[0]),
        lambda(
          identifier(pair[0].value),
          args,
          call(
            member(call(smember(get(name), id('$get')), [args[0]]), pair[0]),
            args
          )
        )
      )
    )
  }
}

exports.implStmt = implStmt
function implStmt(proto, tag, impl) {
  return expr(call(smember(proto, id('$add')), [tag, makeImpl(impl)]));

  function makeImpl(xs) {
    return obj(xs.map(function(x) {
                        return { key: x[0], value: x[1] } }))
  }
}

exports.lambda = lambda;
function lambda(id, args, expr) {
  return fn(id, args, [ret(expr)])
}

exports.app = app;
function app(scope, name, args) {
  return call(member(scope, name), args)
}

exports.call = call;
function call(callee, args) {
  return node('CallExpression', { callee: callee
                                , arguments: args })
}

exports.identifier = identifier;
function identifier(name) {
  return id(sanitiseName(name))
}

exports.exportStmt = exportStmt
function exportStmt(name) {
  return expr(set(member(id("$exports"), name), get(name)))
}

exports.parseExpr = parseExpr;
function parseExpr(js) {
  var tokens = esprima.parse(js).body;
  if (tokens.length !== 1 || tokens[0].type !== 'ExpressionStatement')
    throw new SyntaxError('Expected a single expression.');
  return tokens[0].expression
}

exports.program = program
function program(name, module) {
  return prog([
    varsDecl([[id("_self"), smember(id("$Phemme"), id("Namespace"))]]),
    module,
    expr(set(smember(id("module"), id("exports")), id("_self")))
  ])
}

exports.rawId = id
function id(a) {
  return node('Identifier', { name: a })
}

exports.member = member
function member(object, property) {
  return node( 'MemberExpression'
             , { object: object
               , property: property
               , computed: true })
}
