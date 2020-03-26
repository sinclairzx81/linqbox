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


import { tokenize, input, ParameterToken, Token, TokenKind, TokenStream } from './scanner'

import {
    // Estree
    UnaryOperator, BinaryOperator, NumberLiteral, NullLiteral, StringLiteral, BooleanLiteral,
    Literal, Identifier, MemberExpression, UnaryExpression, UpdateExpression, BinaryExpression,
    Property, ObjectExpression, ArrayExpression, SpreadElement, CallExpression, Expression,
    // LinqBox
    NumberParameter, NullParameter, StringParameter, BooleanParameter, ArrayParameter, ObjectParameter,
    Parameter, FromClause, JoinIntoClause, JoinClause, WhereClause, OrderByClauseArgument, OrderByClause,
    GroupIntoClause, GroupByClause, SelectClause, QueryExpression, Then, ConstClause
} from './syntax'


/** Polyfill for missing [].flat() on older versions of node. */
function flatDeep(arr: any[], d = 1): any[] {
    return d > 0 ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val), [])
                 : arr.slice();
}


// -----------------------------------------------------------------------
// JavaScript
// -----------------------------------------------------------------------

export const binary_operator_precedence = [
    '**', '*', '/', '%', '+', '-', '<<', '>>', '>>>',
    '<', '<=', '>', '>=', 'in', 'instanceof', '==',
    '!=', '===', '!==', '&', '^', '|', '??', '&&', '||'
]

// --------------------------------------------------------
// TypeScript Mappings
// --------------------------------------------------------

type ParserGroup8<T0, T1, T2, T3, T4, T5, T6, T7> = [Parser<T0>, Parser<T1>, Parser<T2>, Parser<T3>, Parser<T4>, Parser<T5>, Parser<T6>, Parser<T7>]
type ParserGroup7<T0, T1, T2, T3, T4, T5, T6> = [Parser<T0>, Parser<T1>, Parser<T2>, Parser<T3>, Parser<T4>, Parser<T5>, Parser<T6>]
type ParserGroup6<T0, T1, T2, T3, T4, T5> = [Parser<T0>, Parser<T1>, Parser<T2>, Parser<T3>, Parser<T4>, Parser<T5>]
type ParserGroup5<T0, T1, T2, T3, T4> = [Parser<T0>, Parser<T1>, Parser<T2>, Parser<T3>, Parser<T4>]
type ParserGroup4<T0, T1, T2, T3> = [Parser<T0>, Parser<T1>, Parser<T2>, Parser<T3>]
type ParserGroup3<T0, T1, T2> = [Parser<T0>, Parser<T1>, Parser<T2>]
type ParserGroup2<T0, T1> = [Parser<T0>, Parser<T1>]
type ParserGroup1<T0> = [Parser<T0>]
type ParserGroup =
    | ParserGroup8<any, any, any, any, any, any, any, any>
    | ParserGroup7<any, any, any, any, any, any, any>
    | ParserGroup6<any, any, any, any, any, any>
    | ParserGroup5<any, any, any, any, any>
    | ParserGroup4<any, any, any, any>
    | ParserGroup3<any, any, any>
    | ParserGroup2<any, any>
    | ParserGroup1<any>
    | any[]

type ParseGroupToUnionScalar<T> =
    T extends ParserGroup8<infer U0, infer U1, infer U2, infer U3, infer U4, infer U5, infer U6, infer U7> ? U0 | U1 | U2 | U3 | U4 | U5 | U6 | U7 :
    T extends ParserGroup7<infer U0, infer U1, infer U2, infer U3, infer U4, infer U5, infer U6> ? U0 | U1 | U2 | U3 | U4 | U5 | U6 :
    T extends ParserGroup6<infer U0, infer U1, infer U2, infer U3, infer U4, infer U5> ? U0 | U1 | U2 | U3 | U4 | U5 :
    T extends ParserGroup5<infer U0, infer U1, infer U2, infer U3, infer U4> ? U0 | U1 | U2 | U3 | U4 :
    T extends ParserGroup4<infer U0, infer U1, infer U2, infer U3> ? U0 | U1 | U2 | U3 :
    T extends ParserGroup3<infer U0, infer U1, infer U2> ? U0 | U1 | U2 :
    T extends ParserGroup2<infer U0, infer U1> ? U0 | U1 :
    T extends ParserGroup1<infer U0> ? U0 :
    any

type ParseGroupToUnionArray<T extends ParserGroup> =
    T extends ParserGroup8<infer U0, infer U1, infer U2, infer U3, infer U4, infer U5, infer U6, infer U7> ? Array<U0 | U1 | U2 | U3 | U4 | U5 | U6 | U7> :
    T extends ParserGroup7<infer U0, infer U1, infer U2, infer U3, infer U4, infer U5, infer U6> ? Array<U0 | U1 | U2 | U3 | U4 | U5 | U6> :
    T extends ParserGroup6<infer U0, infer U1, infer U2, infer U3, infer U4, infer U5> ? Array<U0 | U1 | U2 | U3 | U4 | U5> :
    T extends ParserGroup5<infer U0, infer U1, infer U2, infer U3, infer U4> ? Array<U0 | U1 | U2 | U3 | U4> :
    T extends ParserGroup4<infer U0, infer U1, infer U2, infer U3> ? Array<U0 | U1 | U2 | U3> :
    T extends ParserGroup3<infer U0, infer U1, infer U2> ? Array<U0 | U1 | U2> :
    T extends ParserGroup2<infer U0, infer U1> ? Array<U0 | U1> :
    T extends ParserGroup1<infer U0> ? Array<U0> :
    any[]

// --------------------------------------------------------
// Parser
// --------------------------------------------------------

export type Parser<T> = (stream: TokenStream) => [Result<T>, TokenStream]

export class Result<T> {
    constructor(
        private _success: boolean,
        private _error: string | undefined,
        private _value: T | undefined,
    ) { }
    public success(): boolean { return this._success }
    public value(): T { return this._value! }
    public error(): string { return this._error! }
    public static ok<T>(value: T): Result<T> {
        return new Result<T>(true, undefined, value)
    }
    public static fail<T>(error: string = ''): Result<T> {
        return new Result<T>(false, error, undefined)
    }
}

// --------------------------------------------------------
// Sequence Operators
// --------------------------------------------------------

export const map = <T, U>(parser: Parser<T>, func: (result: T) => U) => (stream: TokenStream): [Result<U>, TokenStream] => {
    const [result, next] = parser(stream)
    if (result.success()) {
        const value = func(result.value())
        return [Result.ok(value), next]
    }
    return [Result.fail(), stream]
}

export const seq = <G extends ParserGroup>(parsers: G) => (stream: TokenStream): [Result<ParseGroupToUnionArray<G>>, TokenStream] => {
    const accumulator = [] as ParseGroupToUnionScalar<G>[] as ParseGroupToUnionArray<G>
    let current = stream.clone()
    for (const parser of parsers) {
        const [result, next] = parser(current)
        if (result.success()) {
            accumulator.push(result.value())
            current = next
            continue
        }
        break
    }
    if (accumulator.length === parsers.length) {
        return [Result.ok(accumulator), current]
    }
    return [Result.fail(), stream]
}

export const any = <G extends ParserGroup>(parsers: G) => (stream: TokenStream): [Result<ParseGroupToUnionScalar<G>>, TokenStream] => {
    let current = stream.clone()
    for (const parser of parsers) {
        const [result, next] = parser(current)
        if (result.success()) {
            return [result, next]
        }
    }
    return [Result.fail(), stream]
}

export const zero_or_one = <T>(parser: Parser<T>) => (stream: TokenStream): [Result<T | null>, TokenStream] => {
    const [result, next] = parser(stream.clone())
    if (result.success()) {
        return [result, next]
    }
    return [Result.ok(null), stream]
}

export const zero_or_more = <T>(parser: Parser<T>) => (stream: TokenStream): [Result<T[]>, TokenStream] => {
    const accumulator = []
    let current = stream.clone()
    while (true) {
        const [result, next] = parser(current)
        if (result.success()) {
            accumulator.push(result.value())
            current = next
            continue
        }
        break
    }
    return [Result.ok(accumulator), current]
}

export const one_or_more = <T>(parser: Parser<T>) => (stream: TokenStream): [Result<T[]>, TokenStream] => {
    const [result, next] = zero_or_more(parser)(stream)
    return (result.value().length === 0)
        ? [Result.fail(), stream]
        : [result, next]
}

/** Parses any item in an encoded scope. */
export const enclosed = <T>(open: Parser<any>, element: Parser<T>, close: Parser<any>) => (stream: TokenStream): [Result<T>, TokenStream] => {
    const select = seq([open, element, close])
    return map(select, result => result[1] as T)(stream)
}

/** Parses for one or more delimited items */
export const delimited = <T>(element: Parser<T>, delimiter: Parser<any>) => (stream: TokenStream): [Result<T[]>, TokenStream] => {
    const [result, next] = any([
        seq([element, zero_or_more(seq([delimiter, element])), delimiter]),
        seq([element, zero_or_more(seq([delimiter, element]))]),
        seq([element])
    ])(stream)
    if (result.success()) {
        const captures = flatDeep(result.value(), 2) // result.value().flat(2)
        if (captures.length % 2 === 0) { captures.pop() } // ,
        const elements = captures.filter((_, index) => index % 2 === 0) as T[]
        return [Result.ok(elements), next]
    }
    return [Result.fail(), stream]
}

/** Parses for zero or more items in an encoded scope. */
export const enclosed_delimited = <T>(open: Parser<any>, element: Parser<T>, close: Parser<any>, delimiter: Parser<any>) => (stream: TokenStream): [Result<T[]>, TokenStream] => {
    const [result, next] = any([
        seq([open, close]),
        seq([open, zero_or_more(seq([element, delimiter])), close]),
        seq([open, element, zero_or_more(seq([delimiter, element])), close])
    ])(stream)

    if (result.success()) {
        const captures = flatDeep(result.value(), 2) // result.value().flat(2)
        captures.shift()
        captures.pop()
        if (captures.length % 2 === 0) { captures.pop() } // ,
        const elements = captures.filter((_, index) => index % 2 === 0) as T[]
        return [Result.ok(elements), next]
    }
    return [Result.fail(), stream]
}

// ------------------------------------------------------------
// operators
// ------------------------------------------------------------

export const select_token = (func: (token: Token) => boolean) => (stream: TokenStream): [Result<Token>, TokenStream] => {
    if (stream.length > 0) {
        const current = stream.clone()
        const token = current.shift()!
        if (func(token)) {
            return [Result.ok(token), current]
        }
    }
    return [Result.fail(), stream]
}

export const op_lbracket = select_token(token => token.kind === TokenKind.BracketLeft)
export const op_rbracket = select_token(token => token.kind === TokenKind.BracketRight)
export const op_lbrace = select_token(token => token.kind === TokenKind.BraceLeft)
export const op_rbrace = select_token(token => token.kind === TokenKind.BraceRight)
export const op_lparen = select_token(token => token.kind === TokenKind.ParenLeft)
export const op_rparen = select_token(token => token.kind === TokenKind.ParenRight)
export const op_add = select_token(token => token.kind === TokenKind.Add)
export const op_subtract = select_token(token => token.kind === TokenKind.Subtract)
export const op_multiply = select_token(token => token.kind === TokenKind.Multiply)
export const op_divide = select_token(token => token.kind === TokenKind.Divide)
export const op_modulo = select_token(token => token.kind === TokenKind.Modulo)
export const op_equal_sign = select_token(token => token.kind === TokenKind.EqualSign)
export const op_greater_than = select_token(token => token.kind === TokenKind.GreaterThan)
export const op_less_than = select_token(token => token.kind === TokenKind.LessThan)
export const op_pipe = select_token(token => token.kind === TokenKind.Pipe)
export const op_exclaimation_mark = select_token(token => token.kind === TokenKind.ExclaimationMark)
export const op_question_mark = select_token(token => token.kind === TokenKind.QuestionMark)
export const op_ampersand = select_token(token => token.kind === TokenKind.Ampersand)
export const op_tilde = select_token(token => token.kind === TokenKind.Tilde)
export const op_dot = select_token(token => token.kind === TokenKind.Dot)
export const op_comma = select_token(token => token.kind === TokenKind.Comma)
export const op_colon = select_token(token => token.kind === TokenKind.Colon)
export const op_instanceof = select_token(token => token.value === 'instanceof')
export const op_delete = select_token(token => token.value === 'delete')
export const op_typeof = select_token(token => token.value === 'typeof')
export const op_void = select_token(token => token.value === 'void')
export const op_in = select_token(token => token.value === 'in')
export const op_const = select_token(token => token.value === 'const')
export const op_let = select_token(token => token.value === 'let')


export const unary_operator = (stream: TokenStream): [Result<UnaryOperator>, TokenStream] => {
    return any([
        map(seq([op_subtract, op_subtract]), () => '--'),
        map(seq([op_add, op_add]), () => '++'),
        map(op_typeof, () => 'typeof'),
        map(op_void, () => 'void'),
        map(op_exclaimation_mark, () => '!'),
        map(op_tilde, () => '~'),
        map(op_add, () => '+'),
        map(op_subtract, () => '-'),
    ])(stream) as [Result<UnaryOperator>, TokenStream]
}
export const binary_operator = (stream: TokenStream): [Result<BinaryOperator>, TokenStream] => {
    return any([
        map(seq([op_equal_sign, op_equal_sign, op_equal_sign]), () => '==='),
        map(seq([op_exclaimation_mark, op_equal_sign, op_equal_sign]), () => '!=='),
        map(seq([op_greater_than, op_greater_than, op_greater_than]), () => '>>>'),
        map(seq([op_pipe, op_pipe]), () => '||'),
        map(seq([op_ampersand, op_ampersand]), () => '&&'),
        map(seq([op_question_mark, op_question_mark]), () => '??'),
        map(seq([op_equal_sign, op_equal_sign]), () => '=='),
        map(seq([op_exclaimation_mark, op_equal_sign]), () => '!='),
        map(seq([op_greater_than, op_equal_sign]), () => '>='),
        map(seq([op_less_than, op_equal_sign]), () => '<='),
        map(seq([op_less_than, op_less_than]), () => '<<'),
        map(seq([op_greater_than, op_greater_than]), () => '>>'),
        map(seq([op_multiply, op_multiply]), () => '**'),
        map(op_instanceof, () => 'instanceof'),
        map(op_greater_than, () => '>'),
        map(op_less_than, () => '<'),
        map(op_in, () => 'in'),
        map(op_ampersand, () => '&'),
        map(op_pipe, () => '|'),
        map(op_add, () => '+'),
        map(op_subtract, () => '-'),
        map(op_multiply, () => '*'),
        map(op_divide, () => '/'),
        map(op_modulo, () => '%'),
    ])(stream) as [Result<BinaryOperator>, TokenStream]
}

// ------------------------------------------------------------
// Literal
// ------------------------------------------------------------

export const literal_string = (stream: TokenStream): [Result<StringLiteral>, TokenStream] => {
    const select = select_token(token => token.kind === TokenKind.String)
    return map(select, token => ({ type: 'Literal', kind: 'string', raw: token.value, value: token.value.slice(1).slice(0, -1) } as StringLiteral))(stream)
}

export const literal_boolean = (stream: TokenStream): [Result<BooleanLiteral>, TokenStream] => {
    const select = select_token(token => token.kind === TokenKind.Keyword && token.value === 'true' || token.value === 'false')
    return map(select, token => ({ type: 'Literal', kind: 'boolean', raw: token.value, value: token.value === 'true' } as BooleanLiteral))(stream)
}

export const literal_null = (stream: TokenStream): [Result<NullLiteral>, TokenStream] => {
    const select = select_token(token => token.kind === TokenKind.Keyword && token.value === 'null')
    return map(select, token => ({ type: 'Literal', kind: 'null', raw: token.value, value: null } as NullLiteral))(stream)
}

export const literal_number = (stream: TokenStream): [Result<NumberLiteral>, TokenStream] => {
    const select = select_token(token => token.kind === TokenKind.Number)
    return map(select, token => ({ type: 'Literal', kind: 'number', raw: token.value, value: parseFloat(token.value) } as NumberLiteral))(stream)
}

export const literal = (stream: TokenStream): [Result<Literal>, TokenStream] => {
    return any([literal_string, literal_boolean, literal_null, literal_number])(stream)
}

// ------------------------------------------------------------
// Parameter:
// ------------------------------------------------------------

// todo: fix parameter select

export const parameter_string = (stream: TokenStream): [Result<StringParameter>, TokenStream] => {
    const select = select_token(token => token.kind === TokenKind.Parameter && typeof token.value === 'string')
    return map(select as any, (token: ParameterToken) => ({ type: 'Parameter', kind: 'string', index: token.index, value: token.value }) as StringParameter)(stream)
}

export const parameter_boolean = (stream: TokenStream): [Result<BooleanParameter>, TokenStream] => {
    const select = select_token(token => token.kind === TokenKind.Parameter && typeof token.value === 'boolean')
    return map(select as any, (token: ParameterToken) => ({ type: 'Parameter', kind: 'boolean', index: token.index, value: token.value }) as BooleanParameter)(stream)
}

export const parameter_null = (stream: TokenStream): [Result<NullParameter>, TokenStream] => {
    const select = select_token(token => token.kind === TokenKind.Parameter && token.value === null)
    return map(select as any, (token: ParameterToken) => ({ type: 'Parameter', kind: 'null', index: token.index, value: token.value }) as NullParameter)(stream)
}

export const parameter_number = (stream: TokenStream): [Result<NumberParameter>, TokenStream] => {
    const select = select_token(token => token.kind === TokenKind.Parameter && typeof token.value === 'number')
    return map(select as any, (token: ParameterToken) => ({ type: 'Parameter', kind: 'number', index: token.index, value: token.value }) as NumberParameter)(stream)
}

export const parameter_array = (stream: TokenStream): [Result<ArrayParameter>, TokenStream] => {
    const select = select_token(token => token.kind === TokenKind.Parameter && typeof token.value === 'object' && Array.isArray(token.value))
    return map(select as any, (token: ParameterToken) => ({ type: 'Parameter', kind: 'array', index: token.index, value: token.value }) as ArrayParameter)(stream)
}

export const parameter_object = (stream: TokenStream): [Result<ObjectParameter>, TokenStream] => {
    const select = select_token(token => token.kind === TokenKind.Parameter && typeof token.value === 'object' && !Array.isArray(token.value))
    return map(select as any, (token: ParameterToken) => ({ type: 'Parameter', kind: 'object', index: token.index, value: token.value }) as ObjectParameter)(stream)
}

export const parameter = any([
    parameter_string,
    parameter_boolean,
    parameter_null,
    parameter_number,
    parameter_array,
    parameter_object
])


// -----------------------------------------------------------------------
// ArrayExpression
// -----------------------------------------------------------------------

export const array_expression_element_spread = (stream: TokenStream): [Result<SpreadElement>, TokenStream] => {
    const spread = seq([op_dot, op_dot, op_dot])
    const candidate = any([query_expression, array_expression, identifier])
    const select = any([
        seq([spread, op_lparen, candidate, op_rparen]),
        seq([spread, candidate]),
    ])
    return map(select, result => ({
        type: 'SpreadElement',
        argument: result.length === 4 ? result[2] : result[1]
    } as SpreadElement))(stream)
}

export const array_expression = (stream: TokenStream): [Result<ArrayExpression>, TokenStream] => {
    const candidates = any([array_expression_element_spread, expression])
    const select = enclosed_delimited(op_lbracket, candidates, op_rbracket, op_comma)
    return map(select, elements => ({ type: 'ArrayExpression', elements } as ArrayExpression))(stream)
}

// -----------------------------------------------------------------------
// ObjectExpression
// -----------------------------------------------------------------------

export const object_expression_property_short = (stream: TokenStream): [Result<Property>, TokenStream] => {
    return map(identifier, identifer => ({ type: 'Property', key: identifer.name, value: identifer } as Property))(stream)
}

export const object_expression_property = (stream: TokenStream): [Result<Property>, TokenStream] => {
    const select = seq([identifier, op_colon, expression])
    return map(select, results => ({ type: 'Property', key: (results[0] as Identifier).name, value: results[2] as Expression } as Property))(stream)
}

export const object_expression_property_index = (stream: TokenStream): [Result<Property>, TokenStream] => {
    const index = any([identifier, literal_number, literal_string])
    const select = seq([op_lbracket, index, op_rbracket, op_colon, expression])
    return map(select, result => {
        const index = result[1] as Identifier | NumberLiteral | StringLiteral
        const expresson = result[4] as Expression
        if (index.type === 'Identifier') {
            return { type: 'Property', key: index.name, value: expresson } as Property
        } else if (index.type === 'Literal' && index.kind === 'number') {
            return { type: 'Property', key: index.value.toString(), value: expresson } as Property
        } else if (index.type === 'Literal' && index.kind === 'string') {
            return { type: 'Property', key: index.value, value: expresson } as Property
        }
        throw Error('unreachable')
    })(stream)
}

export const object_expression_property_spread = (stream: TokenStream): [Result<SpreadElement>, TokenStream] => {
    const spread = seq([op_dot, op_dot, op_dot])
    const candidate = any([object_expression, identifier])
    const select = any([
        seq([spread, op_lparen, candidate, op_rparen]),
        seq([spread, candidate])
    ])
    return map(select, result => ({ type: 'SpreadElement', argument: result.length === 4 ? result[2] : result[1] } as SpreadElement))(stream)
}

export const object_expression = (stream: TokenStream): [Result<ObjectExpression>, TokenStream] => {
    const candidates = any([
        object_expression_property,
        object_expression_property_index,
        object_expression_property_short,
        object_expression_property_spread
    ])
    const select = enclosed_delimited(op_lbrace, candidates, op_rbrace, op_comma)
    return map(select, properties => ({ type: 'ObjectExpression', properties } as ObjectExpression))(stream)
}

// ------------------------------------------------------------
// Identifier
// ------------------------------------------------------------

export const identifier = (stream: TokenStream): [Result<Identifier>, TokenStream] => {
    const select = select_token(token => token.kind === TokenKind.Word || token.value === 'undefined')
    return map(select, token => ({ type: 'Identifier', name: token.value } as Identifier))(stream)
}

// -----------------------------------------------------------------------
// MemberExpression | CallExpression
// -----------------------------------------------------------------------

export const member_call_expression_arguments_spread = (stream: TokenStream): [Result<SpreadElement>, TokenStream] => {
    const spread = seq([op_dot, op_dot, op_dot])
    const candidate = any([array_expression, identifier])
    const select = any([
        seq([spread, op_lparen, candidate, op_rparen]),
        seq([spread, candidate])
    ])
    return map(select, result => ({ type: 'SpreadElement', argument: result.length === 4 ? result[2] : result[1] } as SpreadElement))(stream)
}
export const member_call_expression = (stream: TokenStream): [Result<CallExpression>, TokenStream] => {
    const candidate = any([expression, member_call_expression_arguments_spread])
    const select = enclosed_delimited(op_lparen, candidate, op_rparen, op_comma) // (a, a, a, a)
    return map(select, _arguments => {
        const type = 'CallExpression'
        const callee = null as any as Identifier
        return { type, callee, arguments: _arguments } as CallExpression
    })(stream)
}

export const member_computed_member_expression = (stream: TokenStream): [Result<MemberExpression>, TokenStream] => {
    const select = seq([op_lbracket, any([identifier, literal_string, literal_number]), op_rbracket])
    return map(select, results => {
        const type = 'MemberExpression'
        const computed = true
        const object = null as any as Identifier
        const property = results[1] as Identifier | StringLiteral | NumberLiteral
        return { type, computed, object, property } as MemberExpression
    })(stream)
}

export const member_expression_identifier = (stream: TokenStream): [Result<Identifier>, TokenStream] => {
    // note: member expressions are allowed to be named reserved words.
    // todo: Implement a better member expression parser.
    const identifier_remap = select_token(token => token.kind === TokenKind.Word || token.kind === TokenKind.Keyword || token.value === 'undefined')
    const identifier = map(identifier_remap, token => ({ type: 'Identifier', name: token.value } as Identifier))
    const select = seq([op_dot, identifier])
    return map(select, results => results[1] as Identifier)(stream)
}

export const member_or_call_expression_entry = (stream: TokenStream): [Result<MemberExpression | CallExpression | ObjectExpression | ArrayExpression | Identifier>, TokenStream] => {
    const candidate_0 = any([object_expression, array_expression, identifier]) // {} | [] | x
    const candidate_1 = enclosed(op_lparen, member_or_call_expression_entry, op_rparen)// ({}) | ([]) | (x)
    const candidate_2 = enclosed(op_lparen, member_or_call_expression, op_rparen) // (a()) | ([].x)
    return any([candidate_0, candidate_1, candidate_2])(stream)
}

const member_or_call_expression = (stream: TokenStream): [Result<MemberExpression | CallExpression>, TokenStream] => {
    const [result, next] = seq([member_or_call_expression_entry, one_or_more(any([
        member_computed_member_expression,
        member_call_expression,
        member_expression_identifier
    ]))])(stream)
    if (result.success()) {
        const value = result.value()
        const left = value[0] as MemberExpression | CallExpression | ObjectExpression | ArrayExpression | Identifier
        const right = value[1] as (CallExpression | MemberExpression | Identifier)[]
        //
        // [0] -> computed member expression
        // ()  -> call-expression
        // .x  -> identifier
        //
        let current = left as Identifier | MemberExpression | CallExpression
        for (const next of right) {
            if (next.type === 'MemberExpression') {
                next.object = current
                current = next
                continue
            }
            if (next.type === 'CallExpression') {
                next.callee = current
                current = next
                continue
            }
            if (next.type === 'Identifier') {
                current = {
                    type: 'MemberExpression',
                    computed: false,
                    object: current,
                    property: next
                } as MemberExpression
            }
        }
        return [Result.ok(current as MemberExpression | CallExpression), next]
    }
    return [Result.fail(), stream]
}

// -----------------------------------------------------------------------
// UpdateExpression
// -----------------------------------------------------------------------

export const update_expression_prefix = (stream: TokenStream): [Result<UpdateExpression>, TokenStream] => {
    const select = any([
        seq([op_add, op_add, identifier]),
        seq([op_subtract, op_subtract, identifier]),
    ])
    return map(select, results => {
        const type = 'UpdateExpression'
        const token = results[0] as Token
        const _argument = results[2] as Identifier
        const operator = [token.value, token.value].join('')
        const prefix = true
        return { type, operator, argument: _argument, prefix } as UpdateExpression
    })(stream)
}

export const update_expression_postfix = (stream: TokenStream): [Result<UpdateExpression>, TokenStream] => {
    const select = any([
        seq([identifier, op_add, op_add]),
        seq([identifier, op_subtract, op_subtract]),
    ])
    return map(select, results => {
        const type = 'UpdateExpression'
        const token = results[2] as Token
        const _argument = results[0] as Identifier
        const operator = [token.value, token.value].join('')
        const prefix = false
        return { type, operator, argument: _argument, prefix } as UpdateExpression
    })(stream)
}

export const update_expression = (stream: TokenStream): [Result<UpdateExpression>, TokenStream] => {
    return any([
        update_expression_prefix,
        update_expression_postfix
    ])(stream)
}

// -----------------------------------------------------------------------
// UnaryExpression
// -----------------------------------------------------------------------

export const unary_expression = (stream: TokenStream): [Result<UnaryExpression>, TokenStream] => {
    const select = any([
        seq([op_exclaimation_mark, expression]),
        seq([op_add, expression]),
        seq([op_tilde, expression]),
        seq([op_typeof, expression]),
        seq([op_void, expression]),
        seq([op_delete, expression]),
    ])
    return map(select, results => {
        const type = 'UnaryExpression'
        const token = results[0] as Token
        const arg = results[1] as Expression
        const operator = token.value
        const prefix = true
        return { type, operator, argument: arg, prefix } as UnaryExpression
    })(stream)
}

// -----------------------------------------------------------------------
// BinaryExpression
// -----------------------------------------------------------------------

export const binary_expression_reduce_operator = (sequence: (Expression | BinaryOperator)[], operator_to_reduce: BinaryOperator): (Expression | BinaryOperator)[] => {
    const reduced = [] as (Expression | BinaryOperator)[]
    while (sequence.length >= 3) {
        const left = sequence.shift()! as Expression
        const operator = sequence.shift()! as BinaryOperator
        const right = sequence.shift()! as Expression
        if (operator === operator_to_reduce) {
            const type = 'BinaryExpression'
            const expression = { type, operator, left, right } as BinaryExpression
            sequence.unshift(expression)
        } else {
            sequence.unshift(right)
            reduced.push(left)
            reduced.push(operator)
        }
    }
    reduced.push(sequence.shift()!)
    return reduced
}

export const binary_expression_oprand = (stream: TokenStream): [Result<Expression>, TokenStream] => {
    return any([
        any([
            update_expression, unary_expression, // no binary select on outer scope.
            member_or_call_expression, array_expression, object_expression,
            identifier, literal, parameter
        ]),
        enclosed(op_lparen, any([
            update_expression, unary_expression, binary_expression,
            member_or_call_expression, array_expression, object_expression,
            identifier, literal, parameter
        ]), op_rparen),
    ])(stream)
}

export const binary_expression = (stream: TokenStream): [Result<BinaryExpression>, TokenStream] => {
    const select = seq([binary_expression_oprand, one_or_more(seq([binary_operator, binary_expression_oprand]))])
    return map(select, results => {
        const sequence = flatDeep(results, 2) // results.flat(2) // expect minimum 3 elements
        const reduced = binary_operator_precedence.reduce((items, operator) => {
            return items.length === 1 ? items : binary_expression_reduce_operator(items, operator as BinaryOperator)
        }, sequence)
        return reduced.shift() as BinaryExpression
    })(stream)
}

// -----------------------------------------------------------------------
// Expression
// -----------------------------------------------------------------------

export const expression = (stream: TokenStream): [Result<Expression>, TokenStream] => {
    return any([
        any([
            update_expression, unary_expression, binary_expression,
            member_or_call_expression, array_expression, object_expression,
            identifier, literal, parameter, query_expression
        ]),
        enclosed(op_lparen, expression, op_rparen),
    ])(stream)
}

// -----------------------------------------------------------------------
//
// LinqBox
//
// -----------------------------------------------------------------------

export const op_from = select_token(token => token.value === 'from')
export const op_join = select_token(token => token.value === 'join')
export const op_equals = select_token(token => token.value === 'equals')
export const op_into = select_token(token => token.value === 'into')
export const op_where = select_token(token => token.value === 'where')
export const op_orderby = select_token(token => token.value === 'orderby')
export const op_ascending = select_token(token => token.value === 'ascending')
export const op_descending = select_token(token => token.value === 'descending')
export const op_group = select_token(token => token.value === 'group')
export const op_by = select_token(token => token.value === 'by')
export const op_select = select_token(token => token.value === 'select')
export const op_on = select_token(token => token.value === 'on')

const then = (stream: TokenStream): [Result<Then>, TokenStream] => any([
    from_clause,
    join_into_clause,
    join_clause,
    const_clause,
    where_clause,
    orderby_clause,
    group_into_clause,
    groupby_clause,
    select_clause
])(stream)

export const from_clause = (stream: TokenStream): [Result<FromClause>, TokenStream] => {
    const iterable = any([array_expression, member_or_call_expression, identifier, parameter])
    const select = seq([op_from, identifier, op_in, iterable, then])
    return map(select, result => {
        const type = 'FromClause'
        const identifier = result[1] as Identifier
        const iterable = result[3] as ArrayExpression | MemberExpression | CallExpression | Identifier | External
        const then = result[4] as
            | FromClause | JoinClause
            | WhereClause | GroupIntoClause
            | OrderByClause | SelectClause
        return { type, identifier, iterable, then } as FromClause
    })(stream)
}

export const join_into_clause = (stream: TokenStream): [Result<JoinIntoClause>, TokenStream] => {
    const iterable = any([array_expression, member_or_call_expression, identifier, parameter])
    const oprand = any([member_or_call_expression, identifier])
    const select = seq([op_join, identifier, op_in, iterable, op_on, oprand, op_equals, oprand, op_into, identifier, then])
    return map(select, result => {
        const type = 'JoinIntoClause'
        const identifier = result[1] as Identifier
        const iterable = result[3] as ArrayExpression | MemberExpression | CallExpression | Identifier | External
        const left = result[5] as Identifier | MemberExpression
        const right = result[7] as Identifier | MemberExpression
        const into = result[9] as Identifier
        const then = result[10] as Then
        return { type, identifier, iterable, left, right, into, then } as JoinIntoClause
    })(stream)
}

export const join_clause = (stream: TokenStream): [Result<JoinClause>, TokenStream] => {
    const iterable = any([array_expression, member_or_call_expression, identifier, parameter])
    const oprand = any([member_or_call_expression, identifier])
    const select = seq([op_join, identifier, op_in, iterable, op_on, oprand, op_equals, oprand, then])
    return map(select, result => {
        const type = 'JoinClause'
        const identifier = result[1] as Identifier
        const iterable = result[3] as ArrayExpression | MemberExpression | CallExpression | Identifier | External
        const left = result[5] as Identifier | MemberExpression
        const right = result[7] as Identifier | MemberExpression
        const then = result[8] as Then
        return { type, identifier, iterable, left, right, then } as JoinClause
    })(stream)
}

export const const_clause = (stream: TokenStream): [Result<ConstClause>, TokenStream] => {
    const select = seq([op_const, identifier, op_equal_sign, expression, then])
    return map(select, result => {
        const type = 'ConstClause'
        const identifier = result[1] as Identifier
        const expression = result[3] as Expression
        const then = result[4] as Then
        return { type, identifier, expression, then } as ConstClause
    })(stream)
}

export const where_clause = (stream: TokenStream): [Result<WhereClause>, TokenStream] => {
    const select = seq([op_where, expression, then])
    return map(select, result => {
        const type = 'WhereClause'
        const expression = result[1] as Expression
        const then = result[2] as Then
        return { type, expression, then } as WhereClause
    })(stream)
}

export const orderby_clause_argument = (stream: TokenStream): [Result<OrderByClauseArgument>, TokenStream] => {
    const direction = any([op_ascending, op_descending])
    const select = any([
        seq([any([member_or_call_expression, identifier]), direction]),
        seq([any([member_or_call_expression, identifier])])
    ])
    return map(select, result => {
        if (result.length === 2) {
            const identifier = result[0] as Identifier
            const token = result[1] as Token
            const direction = token.value
            return { identifier, direction } as OrderByClauseArgument
        }
        const identifier = result[0] as Identifier
        const direction = 'ascending'
        return { identifier, direction } as OrderByClauseArgument
    })(stream)
}

export const orderby_clause = (stream: TokenStream): [Result<OrderByClause>, TokenStream] => {
    const args = delimited(orderby_clause_argument, op_comma)
    const select = seq([op_orderby, args, then])
    return map(select, result => {
        const type = 'OrderByClause'
        const args = result[1] as OrderByClauseArgument[]
        const then = result[2] as Then
        return { type, arguments: args, then } as OrderByClause
    })(stream)
}

export const group_into_clause = (stream: TokenStream): [Result<GroupIntoClause>, TokenStream] => {
    const select = seq([op_group, identifier, op_by, expression, op_into, identifier, then])
    return map(select, result => {
        const type = 'GroupIntoClause'
        const identifier = result[1] as Identifier
        const by = result[3] as MemberExpression | Identifier
        const into = result[5] as Identifier
        const then = result[6] as Then
        return { type, identifier, by, into, then } as GroupIntoClause
    })(stream)
}

export const groupby_clause = (stream: TokenStream): [Result<GroupByClause>, TokenStream] => {
    const select = seq([op_group, identifier, op_by, expression])
    return map(select, result => {
        const type = 'GroupByClause'
        const identifier = result[1] as Identifier
        const by = result[3] as Expression
        return { type, identifier, by } as GroupByClause
    })(stream)
}

export const select_clause = (stream: TokenStream): [Result<SelectClause>, TokenStream] => {
    const select = seq([op_select, expression])
    return map(select, result => {
        const type = 'SelectClause'
        const expression = result[1] as Expression
        return { type, expression } as SelectClause
    })(stream)
}

export const query_expression = (stream: TokenStream): [Result<QueryExpression>, TokenStream] => {
    return map(from_clause, result => {
        const type = 'QueryExpression'
        const from = result as FromClause
        return { type, from } as QueryExpression
    })(stream)
}

export const parse = query_expression
