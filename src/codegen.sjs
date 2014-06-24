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
  return name.replace(/(\W)/g, function(x) {
                                 return '$' + x.charCodeAt(0) })
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

function member(object, property) {
  return node( 'MemberExpression'
             , { object: object
               , property: property
               , computed: true })
}

function id(a) {
  return node('Identifier', { name: a })
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
function letStmt(id, value) {
  return varsDecl([[id, value]])
}

exports.module = module;
function module(_id, args, body) {
  return fn(_id, args, [ letStmt(id("$exports", obj([]))) ]
                       .concat(body)
                       .concat([ ret(id("$exports")) ]))
}

exports.lambda = lambda;
function lambda(id, args, expr) {
  return fn(id, args, [ret(expr)])
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

exports.parseExpr = parseExpr;
function parseExpr(js) {
  var tokens = esprima.parse(js).body;
  if (tokens.length !== 1 || tokens[0].type !== 'ExpressionStatement')
    throw new SyntaxError('Expected a single expression.');
  return tokens[0].expression
}
