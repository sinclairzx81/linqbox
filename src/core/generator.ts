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

import {
    UnaryOperator, BinaryOperator, NumberLiteral, NullLiteral, StringLiteral, BooleanLiteral,
    Literal, Identifier, MemberExpression, UnaryExpression, UpdateExpression, BinaryExpression,
    Property, ObjectExpression, ArrayExpression, SpreadElement, CallExpression, Expression,
    NumberParameter, NullParameter, StringParameter, BooleanParameter, ArrayParameter, ObjectParameter,
    Parameter, FromClause, JoinIntoClause, ConstClause, JoinClause, WhereClause, OrderByClauseArgument, OrderByClause,
    GroupIntoClause, GroupByClause, SelectClause, QueryExpression, Then, Clause
} from './syntax'


// ---------------------------------------------------------------------------
// Operation Types
// ---------------------------------------------------------------------------

type Select = (item: any) => any
type Comparer = (a: any, b: any) => number
type Directive = [Comparer, Index, Select]
type Key = any
type Item = any
type Index = number

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------

/** 
 * Utility function that is used by join, groupby and orderby to partition
 * a sequence of tuples. This function only operates on one of the tuples
 * contained within a sequence. An index is required that is used to select
 * the appropriate tuple, and a select function that picks the key for the
 * indexed tuple. This function returns a Map<TKey, TItem[]> where TItem
 * is the indexed tuple value.
 * 
 * @example
 *
 *  const iterator = [
 *      [{ a: 10, b: 20 }, {c: 60, d: 40 }], // 0
 *      [{ a: 10, b: 20 }, {c: 50, d: 40 }], // 1
 *      [{ a: 20, b: 20 }, {c: 40, d: 40 }], // 2
 *      [{ a: 20, b: 20 }, {c: 30, d: 40 }], // 3
 *      [{ a: 30, b: 20 }, {c: 20, d: 40 }], // 4
 *      [{ a: 30, b: 20 }, {c: 10, d: 40 }]  // 5
 *  ]
 *  const results = group(iterator, 0, item => item.a)
 *  for(const [key, items] of [...results]) {
 *      console.log('key:', key)
 *      for(const item of items) {
 *          const { a, b } = item[0]
 *          const { c, d } = item[1]
 *          console.log('  item:', a, b)
 *      }
 *  }
 *  key: 10
 *    item: 10 20
 *    item: 10 20
 *  key: 20
 *    item: 20 20
 *    item: 20 20
 *  key: 30
 *    item: 30 20
 *    item: 30 20
 */
export function group(iterator: any[][], index: number, select: Select): Map<Key, Item[]> {
    const groups = new Map<Key, Item[]>()
    for (const value of iterator) {
        const key = select(value[index])
        if (!groups.has(key)) {
            groups.set(key, [])
        }
        groups.get(key)!.push(value)
    }
    return groups
}

// ---------------------------------------------------------------------------
// GroupBy
// ---------------------------------------------------------------------------

export class Grouping<TKey, TValue> {
    constructor(public key: TKey, public values: TValue[]) { }
    public *[Symbol.iterator]() {
        for (const value of this.values) {
            yield value
        }
    }
}

/** Returns an iterator of Grouping. */
export function* groupby(iterator: any[][], index: number, select: Select) {
    const grouped = group(iterator, index, select)
    for (const [key, items] of grouped) {
        const values = [] as any[]
        for (const item of items) {
            values.push(item[index]);
        }
        yield new Grouping(key, values)
    }
}

/** Returns an iterator of single Grouping. Used for continuation. */
export function* groupinto(iterator: any[][], index: number, select: Select) {
    for (const grouped of groupby(iterator, index, select)) {
        yield [grouped]
    }
}

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

export function ascending(a: any, b: any) { return (a < b) ? -1 : (a > b) ? 1 : 0 }
export function descending(a: any, b: any) { return (a < b) ? 1 : (a > b) ? -1 : 0 }

/**
 * Recursively sorts the given iterable with the suppled ordering directives. This
 * function will recursive group sort based on the keys read from the directive
 * select and continue to do so until the directive stack has been fully shifted.
 * 
 * @example
 * 
* const iterator = [
*    [{ a: 10, b: 20 }, {c: 60, d: 40 }], // 0
*    [{ a: 10, b: 20 }, {c: 50, d: 40 }], // 1
*    [{ a: 20, b: 20 }, {c: 40, d: 40 }], // 2
*    [{ a: 20, b: 20 }, {c: 30, d: 40 }], // 3
*    [{ a: 30, b: 20 }, {c: 20, d: 40 }], // 4
*    [{ a: 30, b: 20 }, {c: 10, d: 40 }]  // 5
* ]
*
* const results = ordering(iterator, [
*    [ascending, 0,  item => item.a],
*    [descending, 1, item => item.c],
* ])
*
* console.log([...results])
* 
* // results

* [
*   [ { a: 10, b: 20 }, { c: 60, d: 40 } ],
*   [ { a: 10, b: 20 }, { c: 50, d: 40 } ],
*   [ { a: 20, b: 20 }, { c: 40, d: 40 } ],
*   [ { a: 20, b: 20 }, { c: 30, d: 40 } ],
*   [ { a: 30, b: 20 }, { c: 20, d: 40 } ],
*   [ { a: 30, b: 20 }, { c: 10, d: 40 } ]
* ]
 */
export function* orderby(iterable: any[][], directives: Directive[]): IterableIterator<any[][]> {
    if (directives.length === 0) { return yield* iterable }
    const [direction, index, select] = directives.shift()!
    const groups = group(iterable, index, select)
    const keys = [...groups.keys()].sort(direction)
    for (const key of keys) {
        const iterable = groups.get(key)!
        yield* orderby(iterable, [...directives])
    }
}

// ---------------------------------------------------------------------------
// GeneratorState
// ---------------------------------------------------------------------------

export class GeneratorState {
    constructor(
        public prev: string,
        public identifiers: string[]
    ) { }
}

export class JavaScriptGenerator {

    private parameter(node: Parameter): string {
        return `$parameters[${node.index}]`
    }

    // #region Expressions

    private identifier(node: Identifier): string {
        return node.name
    }

    private literal(node: Literal) {
        switch (node.kind) {
            case 'string': return node.raw
            case 'boolean': return node.raw
            case 'null': return node.raw
            case 'number': return node.raw
        }
    }

    private property(node: Property): string {
        return `${node.key}: ${this.visit(node.value)}`
    }

    private object_expression(node: ObjectExpression): string {
        const properties = node.properties.map(property => this.visit(property)).join(', ')
        return ['{', properties, '}'].join('')
    }

    private array_expression(node: ArrayExpression): string {
        const elements = node.elements.map(element => this.visit(element)).join(', ')
        return ['[', elements, ']'].join('')
    }

    private unary_expression(node: UnaryExpression): string {
        if (node.prefix) {
            return [node.operator, this.visit(node.argument)].join('')
        } else {
            return [this.visit(node.argument), node.operator].join('')
        }
    }

    private update_expression(node: UpdateExpression): string {
        if (node.prefix) {
            return [node.operator, this.visit(node.argument)].join('')
        } else {
            return [this.visit(node.argument), node.operator].join('')
        }
    }

    private binary_expression(node: BinaryExpression): string {
        return ['(', this.visit(node.left), node.operator, this.visit(node.right), ')'].join(' ')
    }

    private spread_element(node: SpreadElement): string {
        return ['...', this.visit(node.argument)].join('')
    }

    private call_expression(node: CallExpression): string {
        const args = node.arguments.map(argument => this.visit(argument)).join(', ')
        return [this.visit(node.callee), '(', args, ')'].join('')
    }

    private member_expression(node: MemberExpression): string {
        if (node.computed) {
            return [this.visit(node.object), '[', this.visit(node.property), ']'].join('')
        } else {
            return [this.visit(node.object), '.', this.visit(node.property)].join('')
        }
    }

    private visit(node: Expression | SpreadElement | Property): string {
        switch (node.type) {
            case 'ArrayExpression': return this.array_expression(node)
            case 'BinaryExpression': return this.binary_expression(node)
            case 'CallExpression': return this.call_expression(node)
            case 'Parameter': return this.parameter(node)
            case 'Identifier': return this.identifier(node)
            case 'Literal': return this.literal(node)
            case 'MemberExpression': return this.member_expression(node)
            case 'ObjectExpression': return this.object_expression(node)
            case 'Property': return this.property(node)
            case 'QueryExpression': return this.query_expression(node)
            case 'SpreadElement': return this.spread_element(node)
            case 'UnaryExpression': return this.unary_expression(node)
            case 'UpdateExpression': return this.update_expression(node)
            default: throw Error('unreachable')
        }
    }

    // #endregion

    // #region Clauses

    private clause_from(state: GeneratorState, clause: FromClause): string {
        const identifier = clause.identifier.name
        const iterable = this.visit(clause.iterable)
        const value = clause.identifier.name

        const buffer = []
        buffer.push('const iterator = function* () {')
        buffer.push(state.prev)
        buffer.push('for(const prev of iterator()) {')
        buffer.push(`for(const ${identifier} of ${iterable}) {`)
        buffer.push(`yield [...prev, ${value}];`)
        buffer.push('}')
        buffer.push('}')
        buffer.push('}')
        const next = new GeneratorState(buffer.join('\n'), [...state.identifiers, clause.identifier.name])
        return this.visit_clause(next, clause.then)
    }

    private clause_join_into(state: GeneratorState, clause: JoinIntoClause): string {
        const buffer = []
        const left = this.visit(clause.left)
        const right = this.visit(clause.right)
        const base = this.basename(clause.left)
        const index = state.identifiers.indexOf(base)
        const identifier = clause.identifier.name
        const iterable = this.visit(clause.iterable)
        const value = clause.identifier.name

        buffer.push('const iterator = function* () {')
        buffer.push(state.prev)
        buffer.push('for(const prev of iterator()) {')
        buffer.push('const buffer = [];')
        buffer.push(`for(const ${identifier} of ${iterable}) {`)
        buffer.push(`const ${base} = prev[${index}]`)
        buffer.push(`if(${left} === ${right}) {`)
        buffer.push(`buffer.push(${value});`)
        buffer.push('}')
        buffer.push('}')
        buffer.push('yield [...prev, buffer]')
        buffer.push('}')
        buffer.push('}')
        const next = new GeneratorState(buffer.join('\n'), [...state.identifiers, clause.into.name])
        return this.visit_clause(next, clause.then)
    }

    private clause_join(state: GeneratorState, clause: JoinClause): string {
        const buffer = []
        const left = this.visit(clause.left)
        const right = this.visit(clause.right)
        const base = this.basename(clause.left)
        const index = state.identifiers.indexOf(base)
        const identifier = clause.identifier.name
        const iterable = this.visit(clause.iterable)
        const value = clause.identifier.name

        buffer.push('const iterator = function* () {')
        buffer.push(state.prev)
        buffer.push('for(const prev of iterator()) {')
        buffer.push(`for(const ${identifier} of ${iterable}) {`)
        buffer.push(`const ${base} = prev[${index}]`)
        buffer.push(`if(${left} === ${right}) {`)
        buffer.push(`yield [...prev, ${value}];`)
        buffer.push('}')
        buffer.push('}')
        buffer.push('}')
        buffer.push('}')
        const next = new GeneratorState(buffer.join('\n'), [...state.identifiers, clause.identifier.name])
        return this.visit_clause(next, clause.then)
    }

    private clause_const(state: GeneratorState, clause: ConstClause): string {
        const identifiers = ['[', state.identifiers.join(', '), ']'].join('')
        const identifier = clause.identifier.name
        const expression = this.visit(clause.expression)

        const buffer = []
        buffer.push('const iterator = function* () {')
        buffer.push(state.prev)
        buffer.push(`for(const ${identifiers} of iterator()) {`)
        buffer.push(`yield [...${identifiers}, ${expression}];`)
        buffer.push('}')
        buffer.push('}')
        const next = new GeneratorState(buffer.join('\n'), [...state.identifiers, identifier])
        return this.visit_clause(next, clause.then)
    }

    private clause_where(state: GeneratorState, clause: WhereClause): string {
        const identifiers = ['[', state.identifiers.join(', '), ']'].join('')
        const expression = this.visit(clause.expression)

        const buffer = []
        buffer.push('const iterator = function* () {')
        buffer.push(state.prev)
        buffer.push(`for(const ${identifiers} of iterator()) {`)
        buffer.push(`if(${expression}) {`)
        buffer.push(`yield ${identifiers};`)
        buffer.push('}')
        buffer.push('}')
        buffer.push('}')
        const next = new GeneratorState(buffer.join('\n'), [...state.identifiers])
        return this.visit_clause(next, clause.then)
    }

    private clause_orderby(state: GeneratorState, clause: OrderByClause): string {
        const directions = clause.arguments.map(argument => argument.direction)
        const basenames = clause.arguments.map(argument => this.basename(argument.identifier))
        const indices = clause.arguments.map((_, index) => state.identifiers.indexOf(basenames[index]))
        const selectors = clause.arguments.map(argument => this.visit(argument.identifier))
        const directives = clause.arguments.map((_, index) => `[$func.${directions[index]}, ${indices[index]}, ${basenames[index]} => ${selectors[index]}]`).join(',\n')

        const buffer = []
        buffer.push('const iterator = function* () {')
        buffer.push(state.prev)
        buffer.push('yield * $func.orderby([...iterator()], [')
        buffer.push(directives)
        buffer.push('])')
        buffer.push('}')
        const next = new GeneratorState(buffer.join('\n'), [...state.identifiers])
        return this.visit_clause(next, clause.then)
    }

    private clause_group_into(state: GeneratorState, clause: GroupIntoClause): string {
        const selector = this.visit(clause.by)
        const basename = this.basename(clause.identifier)
        const index = state.identifiers.indexOf(basename)

        const buffer = []
        buffer.push('const iterator = function* () {')
        buffer.push(state.prev)
        buffer.push(`yield * $func.groupinto(iterator(), ${index}, ${basename} => ${selector});`)
        buffer.push('}')
        const next = new GeneratorState(buffer.join('\n'), [clause.into.name])
        return this.visit_clause(next, clause.then)
    }

    private clause_group_by(state: GeneratorState, clause: GroupByClause): string {
        const selector = this.visit(clause.by)
        const basename = this.basename(clause.identifier)
        const index = state.identifiers.indexOf(basename)

        const buffer = []
        buffer.push('const iterator = function* () {')
        buffer.push(state.prev)
        buffer.push(`yield * $func.groupby(iterator(), ${index}, ${basename} => ${selector});`)
        buffer.push('}')
        return buffer.join('\n')
    }

    private clause_select(state: GeneratorState, clause: SelectClause): string {
        const identifiers = ['[', state.identifiers.join(', '), ']'].join('')
        const expression = this.visit(clause.expression)

        const buffer = []
        buffer.push('const iterator = function* () {')
        buffer.push(state.prev)
        buffer.push(`for(const ${identifiers} of iterator()) {`)
        buffer.push(`yield ${expression};`)
        buffer.push('}')
        buffer.push('}')
        return buffer.join('\n')
    }

    // #endregion

    /** Builds an IIFE closure for the given expression */
    private query_expression(node: QueryExpression): string {
        const initial_iterator = []
        initial_iterator.push('const iterator = function* () {')
        initial_iterator.push('  yield [];')
        initial_iterator.push('}')
        const state = new GeneratorState(initial_iterator.join('\n'), [])
        const result = this.visit_clause(state, node.from)

        const buffer = []
        buffer.push('(function() {')
        buffer.push(result)
        buffer.push('return iterator();')
        buffer.push('})()')
        return buffer.join('\n')
    }

    private visit_clause(state: GeneratorState, clause: Clause): string {
        switch (clause.type) {
            case 'FromClause': return this.clause_from(state, clause)
            case 'JoinIntoClause': return this.clause_join_into(state, clause)
            case 'JoinClause': return this.clause_join(state, clause)
            case 'ConstClause': return this.clause_const(state, clause)
            case 'WhereClause': return this.clause_where(state, clause)
            case 'OrderByClause': return this.clause_orderby(state, clause)
            case 'GroupIntoClause': return this.clause_group_into(state, clause)
            case 'GroupByClause': return this.clause_group_by(state, clause)
            case 'SelectClause': return this.clause_select(state, clause)
        }
    }

    /** For the given node, resolve the top most basename for the node. */
    private basename(node: Identifier | MemberExpression | CallExpression): string {
        switch (node.type) {
            case 'MemberExpression': return this.basename(node.object)
            case 'CallExpression': return this.basename(node.callee)
            case 'Identifier': return node.name
        }
    }

    public generate(node: QueryExpression): [Function, string] {
        const content = `return ${this.visit(node)}`
        const func = new Function(
            '$func',
            '$parameters',
            content)
        return [func, content]
    }
}

const generator = new JavaScriptGenerator()
export function generate(node: QueryExpression) {
    const [func, code] = generator.generate(node)
    return (parameters: any[]) => func({
        groupby,
        groupinto,
        orderby,
        ascending,
        descending,
    }, parameters)
}
