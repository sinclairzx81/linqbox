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

const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$'.split('')
const digits = '1234567890'.split('')
const keywords = [
    // javascript
    'break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'export',
    'extends', 'finally', 'for', 'function', 'if', 'import',
    'in', 'instanceof', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
    'with', 'yield',
    // literal kinds
    'true', 'false', 'null',
    // additional
    'from', 'join', 'where', 'orderby', 'select', 'groupby', 'into',
]

function isLetter(input: string): boolean {
    return letters.includes(input)
}

function isDigit(input: string): boolean {
    return digits.includes(input)
}
function isKeyword(input: string): boolean {
    return keywords.includes(input)
}

export class InvalidTokenCharacterError extends Error {
    constructor(offset: number, value: string) {
        super(`Invalid character '${value}' at offset ${offset}`)
    }
}

export interface TokenBase { value: string, offset: number, length: number }

export enum TokenKind {
    // Raw
    NewLine, Return, Tabspace, Whitespace, Add, Subtract, Multiply,
    Divide, Modulo, EqualSign, Tilde, ExclaimationMark, QuestionMark,
    Ampersand, GreaterThan, LessThan, ForwardSlash, BackSlash,
    Pipe, Letter, Digit, DoubleQuote, SingleQuote, Colon, SemiColon,
    Dot, Comma, BraceLeft, BraceRight, ParenLeft, ParenRight,
    BracketLeft, BracketRight,
    // Reduced
    Number, Word, String, Keyword,
    // External
    Parameter
}
// Raw
export type Newline = { kind: TokenKind.NewLine } & TokenBase
export type Return = { kind: TokenKind.Return } & TokenBase
export type Tabspace = { kind: TokenKind.Tabspace } & TokenBase
export type Whitespace = { kind: TokenKind.Whitespace } & TokenBase
export type Add = { kind: TokenKind.Add } & TokenBase
export type Subtract = { kind: TokenKind.Subtract } & TokenBase
export type Multiply = { kind: TokenKind.Multiply } & TokenBase
export type Divide = { kind: TokenKind.Divide } & TokenBase
export type Modulo = { kind: TokenKind.Modulo } & TokenBase
export type Equals = { kind: TokenKind.EqualSign } & TokenBase
export type Tilde = { kind: TokenKind.Tilde } & TokenBase
export type ExclaimationMark = { kind: TokenKind.ExclaimationMark } & TokenBase
export type QuestionMark = { kind: TokenKind.QuestionMark } & TokenBase
export type Ampersand = { kind: TokenKind.Ampersand } & TokenBase
export type GreaterThan = { kind: TokenKind.GreaterThan } & TokenBase
export type LessThan = { kind: TokenKind.LessThan } & TokenBase
export type ForwardSlash = { kind: TokenKind.ForwardSlash } & TokenBase
export type BackSlash = { kind: TokenKind.BackSlash } & TokenBase
export type Pipe = { kind: TokenKind.Pipe } & TokenBase
export type Letter = { kind: TokenKind.Letter } & TokenBase
export type Digit = { kind: TokenKind.Digit } & TokenBase
export type DoubleQuote = { kind: TokenKind.DoubleQuote } & TokenBase
export type SingleQuote = { kind: TokenKind.SingleQuote } & TokenBase
export type Colon = { kind: TokenKind.Colon } & TokenBase
export type SemiColon = { kind: TokenKind.SemiColon } & TokenBase
export type Dot = { kind: TokenKind.Dot } & TokenBase
export type Comma = { kind: TokenKind.Comma } & TokenBase
export type CurlyOpen = { kind: TokenKind.BraceLeft } & TokenBase
export type CurlyClose = { kind: TokenKind.BraceRight } & TokenBase
export type BraceOpen = { kind: TokenKind.ParenLeft } & TokenBase
export type BraceClose = { kind: TokenKind.ParenRight } & TokenBase
export type BracketOpen = { kind: TokenKind.BracketLeft } & TokenBase
export type BracketClose = { kind: TokenKind.BracketRight } & TokenBase
// Reduced
export type Number = { kind: TokenKind.Number } & TokenBase
export type Word = { kind: TokenKind.Word } & TokenBase
export type String = { kind: TokenKind.String } & TokenBase
export type Keyword = { kind: TokenKind.Keyword } & TokenBase
// Parameter
export type ParameterToken = { kind: TokenKind.Parameter, offset: number, length: number, index: number, value: any }

export type Token = Newline | Return | Tabspace | Whitespace | Add | Subtract | Multiply |
    Divide | Modulo | Letter | Digit | Equals | Tilde | ExclaimationMark | QuestionMark | QuestionMark |
    Ampersand | GreaterThan | LessThan | ForwardSlash | BackSlash | Pipe | DoubleQuote |
    SingleQuote | Colon | SemiColon | Dot | Comma | CurlyOpen | CurlyClose | BraceOpen |
    BraceClose | BracketOpen | BracketClose | Number | Word | String | Keyword | ParameterToken

export function scan(inputs: Input[]): Token[] {
    const tokens = [] as Token[]
    let parameterIndex = 0
    for (const input of inputs) {
        const value = input.value
        const offset = input.offset
        const length = input.length
        const options = { value, offset, length }

        if (input.type === InputType.Parameter) {
            const index = parameterIndex
            parameterIndex += 1
            tokens.push({ kind: TokenKind.Parameter, ...options, index })
            continue
        }
        switch (value) {
            case ' ': { tokens.push({ kind: TokenKind.Whitespace, ...options }); break }
            case '\n': { tokens.push({ kind: TokenKind.NewLine, ...options }); break }
            case '\r': { tokens.push({ kind: TokenKind.Return, ...options }); break }
            case '\t': { tokens.push({ kind: TokenKind.Tabspace, ...options }); break }
            case '+': { tokens.push({ kind: TokenKind.Add, ...options }); break }
            case '-': { tokens.push({ kind: TokenKind.Subtract, ...options }); break }
            case '*': { tokens.push({ kind: TokenKind.Multiply, ...options }); break }
            case '/': { tokens.push({ kind: TokenKind.Divide, ...options }); break }
            case '%': { tokens.push({ kind: TokenKind.Modulo, ...options }); break }
            case '=': { tokens.push({ kind: TokenKind.EqualSign, ...options }); break }
            case '~': { tokens.push({ kind: TokenKind.Tilde, ...options }); break }
            case '!': { tokens.push({ kind: TokenKind.ExclaimationMark, ...options }); break }
            case '?': { tokens.push({ kind: TokenKind.QuestionMark, ...options }); break }
            case '&': { tokens.push({ kind: TokenKind.Ampersand, ...options }); break }
            case '>': { tokens.push({ kind: TokenKind.GreaterThan, ...options }); break }
            case '<': { tokens.push({ kind: TokenKind.LessThan, ...options }); break }
            case '/': { tokens.push({ kind: TokenKind.ForwardSlash, ...options }); break }
            case '\\': { tokens.push({ kind: TokenKind.BackSlash, ...options }); break }
            case '|': { tokens.push({ kind: TokenKind.Pipe, ...options }); break }
            case "'": { tokens.push({ kind: TokenKind.SingleQuote, ...options }); break }
            case '"': { tokens.push({ kind: TokenKind.DoubleQuote, ...options }); break }
            case ':': { tokens.push({ kind: TokenKind.Colon, ...options }); break }
            case ';': { tokens.push({ kind: TokenKind.SemiColon, ...options }); break }
            case '.': { tokens.push({ kind: TokenKind.Dot, ...options }); break }
            case ',': { tokens.push({ kind: TokenKind.Comma, ...options }); break }
            case '{': { tokens.push({ kind: TokenKind.BraceLeft, ...options }); break }
            case '}': { tokens.push({ kind: TokenKind.BraceRight, ...options }); break }
            case '[': { tokens.push({ kind: TokenKind.BracketLeft, ...options }); break }
            case ']': { tokens.push({ kind: TokenKind.BracketRight, ...options }); break }
            case '(': { tokens.push({ kind: TokenKind.ParenLeft, ...options }); break }
            case ')': { tokens.push({ kind: TokenKind.ParenRight, ...options }); break }
            default: {
                if (isLetter(value)) {
                    tokens.push({ kind: TokenKind.Letter, ...options })
                } else if (isDigit(value)) {
                    tokens.push({ kind: TokenKind.Digit, ...options })
                } else {
                    throw new InvalidTokenCharacterError(offset, value)
                }
            }
        }
    }
    return tokens
}

/** Reduces a consecutive sequence of 'from' token kinds into the given reduced 'to' token kind. */
function reduce(tokens: Token[], from: TokenKind, to: TokenKind): Token[] {
    const output = [] as Token[]
    while (tokens.length > 0) {
        const current = tokens.shift()!
        if (current.kind !== from) {
            output.push(current)
            continue
        }
        const buffer = [current] as Token[]
        while (tokens.length > 0) {
            const next = tokens.shift()!
            if (next.kind === current.kind) {
                buffer.push(next)
            } else {
                tokens.unshift(next)
                break
            }
        }
        const kind = to
        const value = buffer.map(c => c.value).join('')
        const offset = current.offset
        const length = buffer.reduce((acc, c) => acc + c.length, 0)
        output.push({ kind, value, offset, length } as Token)
    }
    return output
}


export class UnclosedStringError extends Error {
    constructor() { super('Unclosed quoted string') }
}

/** Reduces all for all quoted strings. */
function reduce_strings(tokens: Token[]): Token[] {
    const output = [] as Token[]
    while (tokens.length > 0) {
        const current = tokens.shift()!
        if (current.kind !== TokenKind.DoubleQuote &&
            current.kind !== TokenKind.SingleQuote) {
            output.push(current)
            continue
        }
        const buffer = [current] as Token[]
        let ended = false
        while (tokens.length > 0) {
            const next = tokens.shift()!
            buffer.push(next)
            if (next.kind === current.kind) {
                const kind = TokenKind.String
                const offset = current.offset
                const length = buffer.reduce((acc, c) => acc + c.length, 0)
                const value = buffer.map(c => c.value).join('')
                output.push({ kind, value, offset, length })
                ended = true
                break
            }
        }
        if (!ended) {
            throw new UnclosedStringError()
        }
    }
    return output
}
/** Reduces number sequences with decimal places. */
function reduce_numbers(tokens: Token[]): Token[] {
    const output = [] as Token[]
    while (tokens.length > 0) {
        const current = tokens.shift()!
        // test '.1'
        if (current.kind === TokenKind.Dot && tokens.length > 0) {
            const next = tokens.shift()!
            if (next.kind === TokenKind.Number) {
                const kind = TokenKind.Number
                const offset = current.offset
                const buffer = [current, next]
                const length = buffer.reduce((acc, c) => acc + c.length, 0)
                const value = buffer.map(c => c.value).join('')
                output.push({ kind, value, offset, length })
                continue
            } else {
                output.push(current)
                tokens.unshift(next)
                continue
            }
        }
        // test '1.1'
        if (current.kind === TokenKind.Number && tokens.length >= 2) {
            const next_0 = tokens.shift()!
            const next_1 = tokens.shift()!
            if (next_0.kind === TokenKind.Dot && next_1.kind === TokenKind.Number) {
                const kind = TokenKind.Number
                const offset = current.offset
                const buffer = [current, next_0, next_1]
                const length = buffer.reduce((acc, c) => acc + c.length, 0)
                const value = buffer.map(c => c.value).join('')
                output.push({ kind, value, offset, length })
            } else if (next_0.kind === TokenKind.Dot && next_1.kind !== TokenKind.Number) {
                tokens.unshift(next_1)
                const kind = TokenKind.Number
                const offset = current.offset
                const buffer = [current, next_0]
                const length = buffer.reduce((acc, c) => acc + c.length, 0)
                const value = buffer.map(c => c.value).join('')
                output.push({ kind, value, offset, length })
            } else {
                tokens.unshift(next_1)
                tokens.unshift(next_0)
                output.push(current)
            }
        }
        // test '1.'
        else if (current.kind === TokenKind.Number && tokens.length >= 1) {
            const next_0 = tokens.shift()!
            if (next_0.kind === TokenKind.Dot) {
                const kind = TokenKind.Number
                const offset = current.offset
                const buffer = [current, next_0]
                const length = buffer.reduce((acc, c) => acc + c.length, 0)
                const value = buffer.map(c => c.value).join('')
                output.push({ kind, value, offset, length })
            } else {
                tokens.unshift(next_0)
                output.push(current)
            }
        } else {
            output.push(current)
        }
    }
    return output
}

function concat_word_to_numbers(tokens: Token[]): Token[] {
    const output = [] as Token[]
    while (tokens.length > 0) {
        const word = tokens.shift()!
        if (word.kind === TokenKind.Word && tokens.length > 0) {
            const number = tokens.shift()!
            if (number.kind === TokenKind.Number && number.value.indexOf('.') === -1) {
                const kind = TokenKind.Word
                const value = [word.value, number.value].join('')
                const offset = word.offset
                const length = word.length + number.length
                output.push({ kind, value, offset, length })
                continue
            }
            output.push(word)
            output.push(number)
            continue
        }
        output.push(word)
    }
    return output
}

function remap_keywords(tokens: Token[]): Token[] {
    const output = [] as Token[]
    while (tokens.length > 0) {
        const token = tokens.shift()!
        if (token.kind === TokenKind.Word && isKeyword(token.value)) {
            const kind = TokenKind.Keyword
            const value = token.value
            const offset = token.offset
            const length = token.length
            output.push({ kind, value, offset, length })
            continue
        }
        output.push(token)
    }
    return output
}

function filter(tokens: Token[], omit: TokenKind[]) {
    const output = [] as Token[]
    while (tokens.length > 0) {
        const token = tokens.shift()!
        if (!omit.includes(token.kind)) {
            output.push(token)
        }
    }
    return output
}

// -------------------------------------------------------
// TokenStream
// -------------------------------------------------------

export class TokenStream {
    constructor(private tokens: Token[], private index: number) { }
    public get length(): number { return this.tokens.length - this.index }
    public shift(): Token { return this.tokens[this.index++] }
    public clone(): TokenStream { return new TokenStream(this.tokens, this.index) }
    public toString() {
        return {
            // consumed: this.tokens.slice(0, this.index),
            remaining: this.tokens.slice(this.index)
        }
    }
}

/** Tokenizes the given string with optional tokens to omit. */
export function tokenize(input: Input[], omit: TokenKind[] = []): TokenStream {
    const tokens_0 = scan(input)
    const tokens_1 = reduce(tokens_0, TokenKind.Letter, TokenKind.Word)
    const tokens_2 = reduce(tokens_1, TokenKind.Digit, TokenKind.Number)
    const tokens_3 = reduce(tokens_2, TokenKind.Whitespace, TokenKind.Whitespace)
    const tokens_4 = concat_word_to_numbers(tokens_3)
    const tokens_5 = reduce_strings(tokens_4)
    const tokens_6 = reduce_numbers(tokens_5)
    const tokens_7 = remap_keywords(tokens_6)
    return new TokenStream(filter(tokens_7, omit), 0)
}

// -------------------------------------------------------
// Inputs
// -------------------------------------------------------

export enum InputType { Character, Parameter }
export type InputCharacter = { type: InputType.Character, value: string, offset: number, length: number }
export type InputParameter = { type: InputType.Parameter, value: any, offset: number, length: number }
export type Input = InputCharacter | InputParameter

/** Resolves character and parameter inputs from the users tagged template literal. */
export function input(...args: any[]): Input[] {
    const parts = args.shift() as string[]
    const params = args
    const buffer = [] as Input[]
    let offset = 0
    for (const part of parts) {
        for (let i = 0; i < part.length; i++) {
            const type = InputType.Character
            const value = part.charAt(i)
            buffer.push({ type, value, offset, length: 1 })
            offset += 1
        }
        if (params.length > 0) {
            const type = InputType.Parameter
            const value = params.shift()
            buffer.push({ type, value, offset, length: 1 })
            offset += 1
        }
    }
    return buffer
}


