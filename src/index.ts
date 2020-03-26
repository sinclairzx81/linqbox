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

import { QueryExpression } from './core/syntax'
import { tokenize, input, TokenKind } from './core/scanner'
import { generate } from './core/generator'
import { parse } from './core/parser'

/** Enumerable container for syntax tree and generator. */
export class Enumerable<T> {
    constructor(
        public generator: Generator<T>,
        public expression: QueryExpression
    ) { }
    public *[Symbol.iterator]() {
        yield* this.generator
    }
}

/** [Tagged Template Literal] Parses the given LINQ expression and returns a Queryable<T>. */
export function linq<T = any>(...args: any[]): Enumerable<T> {
    const tokens = tokenize(input(...args), [
        TokenKind.Whitespace,
        TokenKind.NewLine,
        TokenKind.Return,
        TokenKind.Tabspace
    ])
    const [result, remaining] = parse(tokens)
    if (!result.success() || remaining.length > 0) {
        throw Error('Query expression is invalid.')
    }
    const parameters = args.slice(1)
    const evaluator = generate(result.value())
    const generator = evaluator(parameters)
    return new Enumerable<T>(generator, result.value())
}