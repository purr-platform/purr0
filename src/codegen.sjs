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
var extend     = require('xtend');
var esprima    = require('esprima');
var stableSort = require('stable');

// -- Helpers ----------------------------------------------------------

var START     = 0
var DELAYED   = 1
var END       = 2
var EXPORTING = 3

function Context(name) {
  this.id   = 0
  this.name = name
}
Context.prototype.newVar = function() {
  return id(this.name + (++this.id))
}


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
  if (!Array.isArray(xs)) return xs
  return xs.reduce(function(ys, x) {
    return Array.isArray(x)?  ys.concat(x)
    :      /* otherwise */    ys.concat([x])
  }, [])
}

function foldr(f, b, xs, idx) {
  idx = idx || 0
  return xs.length === 0?  b
  :      /* otherwise */   f(xs[0], foldr(f, b, xs.slice(1), idx + 1), idx)
}

function sort(xs) {
  return stableSort(xs.slice(), function(a, b) {
    return (a['x-order'] || 0) - (b['x-order'] || 0)
  })
}

// -- Base node constructors -------------------------------------------
function node(type, body) {
  return extend({ type: type }, body)
}

function isBlock(x) {
  return x.type === 'BlockStatement'
}

function delayed(a) {
  return extend(a, { 'x-order': DELAYED })
}

function emptyExpr() {
  return unary('void', true, lit(0))
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

function binary(op, left, right) {
  return node('BinaryExpression', { operator: op
                                  , left: left
                                  , right: right })
}

function unary(op, prefix, arg) {
  return node('UnaryExpression', { operator: op
                                 , argument: arg })
}

function eq(a, b){ return binary('===', a, b) }

function expr(body) {
  return node('ExpressionStatement', { expression: body })
}

function block(body) {
  return node('BlockStatement', { body: flatten(body) })
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
    lambda(null, [id("$scope")], ret(expr)),
    [call(smember(identifier("self"), id("clone")), [identifier("self")])]
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

function isPartial(expr) {
  return expr['x-partial']
}

function rewritePartials(args) {
  var n = 0
  return args.map(function(arg) {
    return isPartial(arg)?  id("$" + (n++))
    :      /* otherwise */  arg
  })
}

function generatePartialArgs(args) {
  return args.filter(isPartial).map(function(_, i) {
    return id("$" + i)
  })
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
function module(name, args, body, contracts, topLevel) {
  var NS = topLevel?        builtin("Namespace")
         : /* otherwise */  id("_self")
  var Arg = topLevel? [id("$Phemme")] : []

  return letStmt(
    name,
    compileContract(
      contracts,
      fn(
        identifier(name.value),
        Arg.concat(args),
        [
          varsDecl([
            [id("$exports"), obj([])],
            [id("_self"), call(smember(NS, id("clone")), [NS])],
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
function ifaceMethDecl(key, args, contracts) {
  args = args.map(λ(x, i) -> id('$' + i));

  return letStmt(
    key,
    call(
      smember(id("$proto"), id("$require")),
      [
        key,
        compileContract(
          contracts,
          lambda(
            identifier(key.value),
            args,
            ret(call(
              member(call(
                smember(id("$proto"), id('$getImplementation')),
                [args[0]]
              ), key),
              args
            ))
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

function hasContracts(xs) {
  return xs.filter(Boolean).length > 0
}

function compileContract(contracts, lambda) {
  contracts = contracts || [[]];
  var pre    = contracts[0];
  var pos    = contracts[1];
  if (!hasContracts(pre) && !pos)  return lambda;
  
  var args   = pre.map(function(_,i){ return id('$' + i) });
  var result = call(lambda, args);
  return fn(
    id('$_contract_$'),
    args,
    [
      args.map(function(a, i) {
        if (!pre[i])  return null
        else          return expr(set(a, call(pre[i], [a])))
      }).filter(Boolean),
      ret(pos? call(pos, [result]) : result)
    ]
  )
}

exports.lambda = lambda;
function lambda(id, args, expr, contracts) {
  return compileContract(
    contracts,
    fn(id, args, Array.isArray(expr)? flatten(expr) : [expr])
  )
}

exports.app = app;
function app(scope, name, args) {
  if (args.some(isPartial))
    return fn(
      null,
      generatePartialArgs(args),
      [ret(call(member(scope, name), rewritePartials(args)))]
    )
  else
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
function exportStmt(name, unpack) {
  return atExportPhase(expr(
    call(
      builtin("doExport"),
      [id("$exports"), name, get(name)].concat(
        unpack? [lit(true)] : []
      )
    )
  ))
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
    varsDecl([[id("_self"), obj([])]]),
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
    var args     = pair[2].map(λ(_, i) -> id('$' + i));
    var contract = pair[3]

    return [
      expr(call(
        smember(id("$adt"), id("$add")),
        [
          key,
          compileContract(
            contract,
            fn(
              identifier(key.value), 
              args,
              makeBody(type, argNames, args)
            )
          )
        ]
      )),
      letStmt(key, member(id("$adt"), key))
    ]
  }

  function makeBody(kind, names, args) {
    switch (kind) {
      case 'Val': return [];
      case 'Bin': return [
        expr(set(smember(thisExpr(), id('$0')), args[0])),
        expr(set(smember(thisExpr(), id('$1')), args[1]))
      ];
      case 'Un': return [
        expr(set(smember(thisExpr(), id('$0')), args[0]))
      ]
      case 'Kw': return [
        expr(set(smember(thisExpr(), id('$0')), args[0]))
      ].concat(args.slice(1).map(function(a, i) {
        return expr(set(smember(thisExpr(), id('$' + (i + 1))), a))
      }));
      default: throw new Error('Unknow data constructor kind: ' + kind)
    }
  }
}

// Pattern matching
function withMatch(vals, xs, vars) {
  return call(
    fn(
      null,
      vars,
      Array.isArray(xs)? flatten(xs) : [xs]
    ),
    vals
  )
}
function guardTry(xs) {
  return node('TryStatement',
              { block: block(xs)
              , handler: node('CatchClause',
                             { param: id('e')
                             , body: block([
                               ifStmt(
                                 unary('!', true, eq(id('e'), lit('$case-failed'))),
                                 throwStmt(id('e'))
                               )
                             ]) })})
}
function failCase() {
  return throwStmt(
    lit('$case-failed')
  )
}
function whenCase(test, consequent) {
  return ifStmt(test, consequent, failCase())
}
function newCaseVar(oldVar) {
  var num = Number(oldVar.name.match(/(\d*)$/)[1] || '0');
  return id('$match' + (num + 1))
}


exports.caseStmt = caseStmt
function caseStmt(vs, xs) {
  return withMatch(
    vs,
    flatten(xs).concat([
      throwStmt(newExpr(id('TypeError'), [lit('No cases matched the value.')]))
    ]),
    vs.map(function(_, i) {
      return id("$match_val" + i)
    })
  )
}

exports.casePatt = casePatt
function casePatt(patts, e) {
  var ctx = new Context("$match")
  var vars = patts.map(function(){ return ctx.newVar() })

  return guardTry([
    ret(patts.reduceRight(function(res, patt, i) {
      var name = ctx.newVar()
      return withMatch(
        [id("$match_val" + i)],
        patt(name, res, ctx),
        [name]
      )
    }, e))
  ])
}

exports.caseAny = caseAny
function caseAny() {
  return function(val, e, ctx) {
    return ret(e)
  }
}

exports.caseVal = caseVal
function caseVal(v) {
  return function(val, e, ctx) {
    return whenCase(
      eq(val, v),
      ret(e)
    )
  }
}

exports.caseVar = caseVar
function caseVar(a) {
  return function(val, e, ctx) {
    return [
      varsDecl([[a, val]]),
      ret(e)
    ]
  }
}

exports.caseId = caseId
function caseId(tag) {
  return function(val, e, ctx) {
    return whenCase(
      eq(smember(val, id("$$ctag")), tag),
      ret(e)
    )
  }
}

exports.caseUn = caseUn
function caseUn(tag, body) {
  return function(val, e, ctx) {
    var subVar = ctx.newVar()
    return whenCase(
      eq(smember(val, id("$$ctag")), tag),
      ret(withMatch(
        [smember(val, id('$0'))],
        body(subVar, e, ctx),
        [subVar]
      ))
    )
  }
}

exports.caseBin = caseBin
function caseBin(tag, l, r) {
  return function(val, e, ctx) {
    var lvar = ctx.newVar(), rvar = ctx.newVar()
    return whenCase(
      eq(smember(val, id("$$ctag")), tag),
      ret(withMatch(
        [smember(val, id("$0"))],
        l(
          lvar,
          withMatch(
            [smember(val, id("$1"))],
            r(rvar, e, ctx),
            [rvar]
          ),
          ctx
        ),
        [lvar]
      ))
    )
  }
}

exports.caseKw = caseKw
function caseKw(tag, args) {
  var names = [lit("self")].concat(tag.value.split(':').slice(0,-1).map(lit));
  return function(val, e, ctx) {
    return whenCase(
      eq(smember(val, id("$$ctag")), tag),
      ret(names.reduceRight(function(res, name, i) {
        var lvar = ctx.newVar();
        return withMatch(
          [smember(val, id('$' + i))],
          args[i](lvar, res, ctx),
          [lvar]
        )
      }, e))
    )
  }
}

exports.use = use
function use(e) {
  return delayed(
    expr(call(builtin("$destructiveExtend"), [id("_self"), e]))
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

exports.decl = decl
function decl(id, e) {
  return varsDecl([[id, e]])
}

exports.binding = binding
function binding(vars, e) {
  return call(
    fn(
      null,
      [identifier("self")],
      vars.concat([ret(e)])
    ),
    [call(smember(identifier("self"), id("clone")), [identifier("self")])]
  )
}

exports.list = list
function list(xs) {
  return xs.reduceRight(function(result, x) {
    return call(
      member(identifier("self"), lit("::")),
      [x, result]
    )
  }, call(member(identifier("self"), lit("Nil")), []))
}

exports.ifExpr = ifExpr
function ifExpr(test, consequent, alternate) {
  return node('ConditionalExpression',
              { test: test,
                consequent: consequent,
                alternate: alternate })
}

exports.partial = partial
function partial() {
  return extend(
    fn(null, [id("$0")], [ret(id("$0"))]),
    { 'x-partial': true }
  )
}

exports.member = memberExpr;
function memberExpr(obj, name) {
  return call(
    smember(obj, id("$get")),
    [name]
  )
}

exports.retExpr = ret;
exports.cond = cond;
function cond(xs) {
  return xs.map(function(x) {
    return ifStmt(x[0], ret(x[1]))
  })
}

exports.empty = empty
function empty() {
  return []
}

exports.map = map
function map(xs) {
  return call(
    smember(builtin("ExtRecord"), id("$fromObject")),
    [
      obj(xs.map(function(x) {
        return { key: x[0], value: x[1] }
      }))
    ]
  )
}

exports.importStmt = importStmt
function importStmt(p, kw, name) {
  return expr(call(
    fn(
      null,
      [id("$mod")],
      [
        expr(set(id("$mod"), instantiate(kw))),
        open(name)
      ]
    ),
    [call(id("require"), [p])]
  ));

  function instantiate(kw) {
    if (kw === null) return call(member(id("$mod"), lit("default")), []);
    else             return call(member(id("$mod"), kw[0]), kw[1])
  }

  function open(name) {
    if (name !== null) return letStmt(name, id("$mod"))
    else
      return expr(call(
        builtin("$destructiveExtend"),
        [identifier("self"), id("$mod")]
      ))
  }
}

exports.parseProg = parseProg
function parseProg(js) {
  return esprima.parse(js).body
}
