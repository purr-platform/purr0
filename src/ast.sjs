// # module: Purr.ast
//
// Provides a representation of Purr's AST.

var { Base, Cata } = require('adt-simple');

data RecordField {
  key: String,
  value: Expr
} deriving (Base)

union ExportStyle {
  Single,
  Unpack
} deriving (Base, Cata)

union InterfaceDecl {
  Needs { 
    value: Expr 
  },
  Method { 
    message: Message,
    body: Expr
  },
  MethodDecl {
    message: FnMessage,
    decorators: Array
  }
} deriving (Base, Cata)

union DataPattern {
  Struct {
    messages: Array/*(FnMessage)*/
  },
  ADT {
    cases: Array/*(Message)*/
  }
}

data Contract(Expr)
deriving (Base)

union ParamName {
  Ignore,
  Binding(Id)
} deriving (Base, cata)

data Param {
  name: ParamName,
  contract: Contract
} deriving (Base)

union FnMessage {
  message: Message,
  contract: Contract
}

union Message {
  Nullary {
    name: Id
  },
  Unary {
    name: Id,
    params: Array/*(Param)*/,
  },
  Binary {
    name: Id,
    params: Array/*(Param)*/,
  }
  Keyword {
    name: Id,
    params: Array/*(Param)*/,
  }
} deriving (Base, Cata)

union Expr {
  // Values
  Id { value: String },
  Bool { value: Boolean },
  Num { value: Number },
  Str { value: String },
  Nil,
  Vector { value: Array/*(Any)*/ },
  Record { value: Array/*(RecordField)*/ },

  // Expressions / Declarations
  Empty,
  Member {
    receiver: Expr,
    message: Id
  },
  Export {
    message: Id,
    style: ExportStyle
  },
  Let {
    message: Id,
    body: Expr
  },
  Module {
    message: Id,
    params: Array/*(Id)*/,
    body: Array/*(Expr)*/,
    decorators: Array/*(Decorator)*/
  },
  Interface {
    name: Id,
    declarations: Array/*(InterfaceDecl)*/
  }, 
  Implement {
    iface: Expr,
    value: Expr,
    methods: Array/*(Method)*/
  },
  Data {
    value: DataPattern
  },
  Decorator {
    name: Id,
    decorator: Expr,
    lambda: Expr
  },
  Import {
    expression: Expr,
    bindTo: */*Maybe(Id)*/,
    renaming: Array/*(Id, Id)*/
  },
  

  // Combinations
  Seq(ExprList),
  
} deriving (Base, Cata)
