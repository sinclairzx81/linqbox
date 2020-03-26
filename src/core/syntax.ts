/*--------------------------------------------------------------------------

LinqBox - Language Integrated Query for JavaScript

The MIT License (MIT)

Copyright (c) 2020 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

// -------------------------------------------------------------------------
//
// Syntax Tree: Estree Subset
//
// The following AST nodes are a subset of estree AST. They encompass 
// any valid JavaScript expression excluding function and assignment. 
// The Expression node however is extended here to allow for Parameter
// variables to be added to the syntax tree as Parameters. They are 
// treated as valid Expression types.
//
// -------------------------------------------------------------------------

// ------------------------------------------------
// Operators
// ------------------------------------------------

export type UpdateOperator = '++' | '--'

export type UnaryOperator =
    '!' | '+' | '-' | '~' | 'typeof' | 'void' | 'delete'

export type BinaryOperator =
    '**' | '*' | '/' | '%' | '+' | '-' | '<<' | '>>' | '>>>' |
    '<' | '<=' | '>' | '>=' | 'in' | 'instanceof' | '==' |
    '!=' | '===' | '!==' | '&' | '^' | '|' | '??' | '&&' | '||'

// ------------------------------------------------
// Identifier
// ------------------------------------------------

export type Identifier = { type: 'Identifier', name: string }

// ------------------------------------------------
// Literal
// ------------------------------------------------

export interface LiteralBase { type: 'Literal', raw: string }
export type StringLiteral = { kind: 'string', value: string } & LiteralBase
export type BooleanLiteral = { kind: 'boolean', value: boolean } & LiteralBase
export type NullLiteral = { kind: 'null', value: null } & LiteralBase
export type NumberLiteral = { kind: 'number', value: number } & LiteralBase
export type Literal =
    | StringLiteral
    | BooleanLiteral
    | NullLiteral
    | NumberLiteral

// ------------------------------------------------
// SpreadElement
// ------------------------------------------------

export type SpreadElement = {
    type: 'SpreadElement',
    argument:
    | ObjectExpression
    | ArrayExpression
    | Identifier
    | Parameter
    | QueryExpression
}

// ------------------------------------------------
// ArrayExpression
// ------------------------------------------------

export type ArrayExpression = {
    type: 'ArrayExpression',
    elements: (Expression | SpreadElement)[]
}
export type Property = {
    type: 'Property',
    key: string, value: Expression
}
export type ObjectExpression = {
    type: 'ObjectExpression',
    properties: (Property | SpreadElement)[]
}
export type CallExpression = {
    type: 'CallExpression',
    callee: Identifier | MemberExpression | CallExpression,
    arguments: (Expression | SpreadElement)[]
}
export type UpdateExpression = {
    type: 'UpdateExpression',
    operator: UpdateOperator,
    argument: Identifier,
    prefix: boolean
}
export type UnaryExpression = {
    type: 'UnaryExpression',
    operator: UnaryOperator,
    argument: Expression,
    prefix: boolean
}
export type BinaryExpression = {
    type: 'BinaryExpression',
    operator: BinaryOperator,
    left: Expression,
    right: Expression
}
export type MemberExpression = {
    type: 'MemberExpression',
    object: Identifier | MemberExpression | CallExpression,
    computed: boolean,
    property: Identifier | Literal
}
export type Expression =
    // Estree
    | ObjectExpression
    | ArrayExpression
    | UpdateExpression
    | UnaryExpression
    | BinaryExpression
    | CallExpression
    | MemberExpression
    | Identifier
    | Literal
    // Additional
    | Parameter
    | QueryExpression


// -------------------------------------------------------------------------
//
// Parameters
//
// The following nodes allow external data passed into a query to be
// represented in the syntax tree. They are not actual syntax but are
// still represented as such. Their closest analog would be literals.
//
// -------------------------------------------------------------------------

export interface ParameterBase { type: 'Parameter' }
export type StringParameter = { kind: 'string', index: number, value: string } & ParameterBase
export type BooleanParameter = { kind: 'boolean', index: number, value: boolean } & ParameterBase
export type NullParameter = { kind: 'null', index: number, value: null } & ParameterBase
export type NumberParameter = { kind: 'number', index: number, value: number } & ParameterBase
export type ObjectParameter = { kind: 'object', index: number, value: any } & ParameterBase
export type ArrayParameter = { kind: 'array', index: number, value: any[] } & ParameterBase
export type Parameter =
    | StringParameter
    | BooleanParameter
    | NullParameter
    | NumberParameter
    | ObjectParameter
    | ArrayParameter

// -------------------------------------------------------------------------
//
// LinqBox
//
// The following nodes are extensions to the ESTree spec. These do have
// possible ESTree representations which are commented below, however for
// clarity and simplicity, they are expressed as distinct node types. 
// It may be possible for LINQ expressions to be expressed purely as
// ESTree nodes however.
//
// -------------------------------------------------------------------------

export type Then =
    | FromClause
    | JoinIntoClause
    | JoinClause
    | ConstClause
    | WhereClause
    | OrderByClause
    | GroupIntoClause
    | GroupByClause
    | SelectClause

export type FromClause = {
    type: 'FromClause',
    identifier: Identifier,
    iterable: ArrayExpression | MemberExpression | CallExpression | Identifier | Parameter,
    then: Then
}

export type JoinIntoClause = {
    type: 'JoinIntoClause',
    identifier: Identifier,
    iterable: ArrayExpression | MemberExpression | CallExpression | Identifier | Parameter,
    left: Identifier | MemberExpression,
    right: Identifier | MemberExpression,
    into: Identifier
    then: Then
}

export type JoinClause = {
    type: 'JoinClause',
    identifier: Identifier,
    iterable: ArrayExpression | MemberExpression | CallExpression | Identifier | Parameter,
    left: Identifier | MemberExpression,
    right: Identifier | MemberExpression,
    then: Then
}

export type ConstClause = {
    type: 'ConstClause',
    identifier: Identifier,
    expression: Expression
    then: Then
}

export type WhereClause = {
    type: 'WhereClause',
    expression: Expression
    then: Then
}

export type OrderByClauseArgument = {
    identifier: Identifier | MemberExpression
    direction: 'ascending' | 'descending'
}

export type OrderByClause = {
    type: 'OrderByClause',
    arguments: OrderByClauseArgument[]
    then: Then
}

export type GroupIntoClause = {
    type: 'GroupIntoClause',
    identifier: Identifier
    by: Expression
    into: Identifier
    then: Then
}

export type GroupByClause = {
    type: 'GroupByClause',
    identifier: Identifier
    by: Expression
}

export type SelectClause = {
    type: 'SelectClause',
    expression: Expression
}

export type Clause =
    | FromClause
    | JoinIntoClause
    | JoinClause
    | ConstClause
    | WhereClause
    | OrderByClause
    | GroupIntoClause
    | GroupByClause
    | SelectClause

export type QueryExpression = {
    type: 'QueryExpression'
    from: FromClause
}

