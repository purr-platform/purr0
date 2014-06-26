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

var START     = 0
var DELAYED   = 1
var END       = 2
var EXPORTING = 3

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

function sort(xs) {
  return xs.slice().sort(function(a, b) {
    return (a['x-order'] || 0) - (b['x-order'] || 0)
  })
}

// -- Base node constructors -------------------------------------------
function node(type, body) {
  return extend({ type: type }, body)
}

function delayed(a) {
  return extend(a, { 'x-order': DELAYED })
}

function atEnd(a) {
  return extend(a, { 'x-order': END })
}

function atExportPhase(a) {
  return extend(a, { 'x-order': EXPORTING })
}

function lit(value) {
  return node('Literal', { value: value })
}

function throwStmt(x) {
  return node('ThrowStatement', { argument: x })
}

function ifStmt(test, consequent, alternate) {
  return node('IfStatement', { test: test
                             , consequent: consequent
                             , alternate: alternate })
}

function when(test, consequent) {
  return ifStmt(test, consequent, null)
}

function binary(op, left, right) {
  return node('BinaryExpression', { operator: op
                                  , left: left
                                  , right: right })
}

function unary(op, prefix, arg) {
  return node('UnaryExpression', { operator: op
                                 , left: left
                                 , right: right })
}

function eq(a, b){ return binary('===', a, b) }

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
    [call(smember(id("_self"), id("clone")), [id("_self")])]
  )
}

function using(name, value, body) {
  return expr(call(fn(null, [name], body), [value]))
}

function force(value) {
  return call(value, [])
}

function get(name) {
  return member(id("_self"), name)
}

function thunk(expr) {
  return fn(null, [], [ret(expr)])
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
          varsDecl([
            [id("$exports"), obj([])],
            [id("_self"), id("$scope")],
          ]),
        ].concat(sort(flatten(body)))
         .concat([
           ret(id("$exports"))
         ])
      )
    )
  )
}

exports.ifaceStmt = ifaceStmt;
function ifaceStmt(name, decls) {
  return using(id("$proto"), newExpr(builtin("Protocol"), [name]), [
    letStmt(name, thunk(id("$proto")))
  ].concat(sort(flatten(decls))));
}

exports.ifaceMethDecl = ifaceMethDecl
function ifaceMethDecl(key, args) {
  args = args.map(λ(x) -> identifier(x.value));

  return letStmt(
    key,
    call(
      smember(id("$proto"), id("$require")),
      [
        key,
        lambda(
          identifier(key.value),
          args,
          call(
            member(call(smember(id("$proto"), id('$get')), [args[0]]), key),
            args
          )
        )
      ]
    )
  )
}

exports.ifaceMethDef = ifaceMethDef
function ifaceMethDef(key, args, val) {
  return [
    ifaceMethDecl(key, args),
    expr(call(
      smember(id("$proto"), id("$addDefault")),
      [ key, val ]
    ))
  ]
}

exports.ifaceNeed = ifaceNeed
function ifaceNeed(base) {
  return atEnd(expr(call(
    smember(id("$proto"), id("$extend")),
    [ base ]
  )))
}

exports.implStmt = implStmt;
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

exports.exportStmt = exportStmt;
function exportStmt(name) {
  return atExportPhase(expr(set(member(id("$exports"), name), get(name))))
}

exports.parseExpr = parseExpr;
function parseExpr(js) {
  var tokens = esprima.parse(js).body;
  if (tokens.length !== 1 || tokens[0].type !== 'ExpressionStatement')
    throw new SyntaxError('Expected a single expression.');
  return tokens[0].expression
}

exports.program = program;
function program(name, module) {
  return prog([
    varsDecl([[id("_self"), smember(id("$Phemme"), id("Namespace"))]]),
    module,
    expr(set(
      smember(id("module"), id("exports")),
      name.value === 'default'?  member(id("_self"), lit("default"))
      :                          id("_self")
    ))
  ])
}

exports.rawId = id;
function id(a) {
  return node('Identifier', { name: a })
}

exports.member = member;
function member(object, property) {
  return node( 'MemberExpression'
             , { object: object
               , property: property
               , computed: true })
}

exports.adtStmt = adtStmt;
function adtStmt(name, cases) {
  return using(id("$adt"), newExpr(builtin("ADT"), [name]), [
    letStmt(name, thunk(id("$adt")))
  ].concat(flatten(cases.map(makeCase)))
   .concat([
     expr(call(smember(id("$adt"), id("$seal")), []))
   ]));

  function makeCase(pair) {
    var type     = pair[0];
    var key      = pair[1];
    var argNames = key.value.split(':').map(lit)
    var args     = pair[2].map(λ(x) -> identifier(x.value));

    return [
      expr(call(
        smember(id("$adt"), id("$add")),
        [key, fn(identifier(key.value), args, makeBody(type, argNames, args))]
      )),
      letStmt(key, member(id("$adt"), key))
    ]
  }

  function makeBody(kind, names, args) {
    switch (kind) {
      case 'Val': return [];
      case 'Bin': return [
        expr(set(smember(thisExpr(), id('left')), args[0])),
        expr(set(smember(thisExpr(), id('right')), args[1]))
      ];
      case 'Un': return [
        expr(set(member(thisExpr(), names[0]), args[0]))
      ]
      case 'Kw': return [
        expr(set(smember(thisExpr(), id('self')), args[0]))
      ].concat(args.slice(1).map(function(a, i) {
        return expr(set(member(thisExpr(), names[i]), a))
      }));
      default: throw new Error('Unknow data constructor kind: ' + kind)
    }
  }
}

// Pattern matching
exports.caseStmt = caseStmt
function caseStmt(v, xs) {
  return call(
    fn(
      null,
      [id("$match")],
      xs.concat([
        throwStmt(newExpr(id('TypeError'), lit('No cases matched the value.')))
      ])
    ),
    [v]
  )
}

exports.caseAny = caseAny
function caseAny() {
  return function(e) {
    return ret(e)
  }
}

exports.caseVal = caseVal
function caseVal(v) {
  return function(e) {
    return when(
      eq(id('$match'), v),
      ret(e)
    )
  }
}

exports.caseId = caseId
function caseId(tag) {
  return function(v) {
    return when(
      eq(smember(id("$match"), id("$$ctag")), tag),
      ret(v)
    )
  }
}

exports.caseUn = caseUn
function caseUn(tag, arg) {
  return function(e) {
    return when(
      eq(smember(id("$match"), id("$$ctag")), tag),
      block([
        varsDecl([[arg, member(id("$match"), tag)]]),
        ret(e)
      ])
    )
  }
}

exports.caseBin = caseBin
function caseBin(tag, args) {
  return function(e) {
    return when(
      eq(smember(id("$match"), id("$$ctag")), tag),
      block([
        varsDecl([
          [args[0], smember(id("$match"), id("left"))],
          [args[1], smember(id("$match"), id("right"))]
        ]),
        ret(e)
      ])
    )
  }
}

exports.caseKw = caseKw
function caseKw(tag, args) {
  var names = tag.value.split(':').map(lit);
  return function(e) {
    return when(
      eq(smember(id("$match"), id("$$ctag")), tag),
      block([
        varsDecl([
          [args[0], smember(id("$match"), id("self"))]
        ].concat(args.slice(1).map(function(a, i) {
          return [a, names[i]]
        }))),
        ret(e)
      ])
    )
  }
}

exports.use = use
function use(e) {
  return delayed(
    expr(call(smember(id("$Phemme"), id("$destructiveExtend")), [id("_self"), e]))
  )
}

exports.bool = bool
function bool(a) {
  return lit(a)
}

exports.decorator = decorator
function decorator(f, name, e) {
  return flatten([e]).concat([
    atEnd(
      letStmt(
        name,
        call(f, [get(name)])
      )
    )
  ])
}
