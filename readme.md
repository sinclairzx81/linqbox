<div align='center'>

<h1>LinqBox</h1>

<p>Language Integrated Query for JavaScript</p>

[![npm version](https://badge.fury.io/js/%40sinclair%2Flinqbox.svg)](https://badge.fury.io/js/%40sinclair%2Flinqbox)
[![GitHub CI](https://github.com/sinclairzx81/linqbox/workflows/GitHub%20CI/badge.svg)](https://github.com/sinclairzx81/linqbox/actions)


<img src="./doc/logo.png"></img>

</div>


##### If it's possible in C#
```csharp
using System.Linq;

var query = from n in new int [] { 0, 1, 2 } select n + 1;

Console.WriteLine(query.ToList());
```
##### Let it be so for JavaScript
```typescript
import { linq } from '@sinclair/linqbox'

const query = linq `from n in [0, 1, 2] select n + 1`

console.log([...query])
```

<a name="Overview"></a>

## Overview

LinqBox is an experimental implementation of Language Integrated Query for JavaScript. It is written as an abstraction for JavaScript generators where it allows sequences of generators to be functionally composed through LINQ query expression syntax. 

 LinqBox provides a sole [Tagged Template](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) function as its API. Within it, one can write a typical LINQ expression. LinqBox will parse it, build a syntax tree representation of it; and construct a series of `function*` generators to execute the query at a later point in time. The queryable object it returns is a `Enumerable<T>` which houses the parsed syntax tree and which implements a `[Symbol.iterator]`. The syntax tree itself can be reflected and potentially mapped to other domains such as SQL.

LinqBox was written as a research project to explore leveraging LINQ as a form of unified query syntax for JavaScript. It does require an ES6+ JavaScript runtime, should work ok on most modern browsers.

This project is offered as is to anyone who may find it of use.

License MIT

## Contents

- [Overview](#Overview)
- [Install](#Install)
- [Syntax](#Syntax)
- [Keywords](#Keywords)

<a name="Install"></a>

## Install
```bash
$ npm install @sinclair/linqbox
```

<a name="Syntax"></a>

## Syntax

Linqbox implements a JavaScript version of LINQ as one would probably imagine it. Internally Linqbox parses for all JavaScript expressions (except functions) and constructs <a href="https://github.com/estree/estree">ESTree</a> based expressions trees that are extended to support the standard set of LINQ clauses and keywords. 

The following illustrates basic usage with an arbitrary query that uses <a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/from-clause">from</a>, <a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/where-clause">where</a>, <a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/orderby-clause">orderby</a> and <a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/select-clause">select</a>.

```typescript
import { linq } from '@sinclair/linqbox'

const users = [
    { userid: 0, firstname: 'dave', lastname: 'smith' },
    { userid: 1, firstname: 'smith', lastname: 'rogers' },
    { userid: 2, firstname: 'jones', lastname: 'edgar' },
    { userid: 3, firstname: 'alice', lastname: 'jenkins' }
]

const query = linq`
    from user in ${users} 
    where user.userid > 1
    const fullname = [
        user.firstname, 
        user.lastname
    ].join(' ')
    orderby user.firstname
    select { 
        ...user, 
        fullname
    }`

for (const user of query) {
    console.log(user)
}
```
Results in the following output
```javascript
{
  userid: 3,
  firstname: 'alice',
  lastname: 'jenkins',
  fullname: 'alice jenkins'
}
{
  userid: 2,
  firstname: 'jones',
  lastname: 'edgar',
  fullname: 'jones edgar'
}
```
<a name="Keywords"></a>

## Keywords

The following are the keywords supported by LinqBox. Most existing C# LINQ queries should trivially map to LinqBox with minimal changes. The following table lists them all with links to the official Microsoft documentation for additional information on how to use them. All are identical to the C# counterparts with the exception of `let` which has been renamed to `const` due to `let` having conflicting readonly semantics in C# that wouldn't make sense in JavaScript.

<table>
    <thead>
        <tr>
            <th>Clause</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/from-clause">from</a></td>
            <td>Specifies a data source and a range variable (similar to an iteration variable).</td>
        </tr>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/where-clause">where</a></td>
            <td>Filters source elements based on one or more boolean expressions separated by logical AND and OR operators or for truthyness.</td>
        </tr>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/select-clause">select</a></td>
            <td>Specifies the type and shape that the elements in the returned sequence will have when the query is executed.</td>
        </tr>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/group-clause">group</a></td>
            <td>Groups query results according to a specified key value.</td>
        </tr>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/into">into</a></td>
            <td>Provides an identifier that can serve as a reference to the results of a join, group or select clause.</td>
        </tr>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/orderby-clause">orderby</a></td>
            <td>Sorts query results in ascending or descending order based on the default comparer for the element type.</td>
        </tr>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/join-clause">join</a></td>
            <td>Joins two data sources based on an equality comparison between two specified matching criteria.</td>
        </tr>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/let-clause">const</a></td>
            <td>Same as <a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/let-clause">let</a>. Introduces a range variable to store sub-expression results in a query expression. </td>
        </tr>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/in">in</a></td>
            <td>Contextual keyword in a <a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/join-clause">join</a> clause.</td>
        </tr>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/on">on</a></td>
            <td>Contextual keyword in a <a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/join-clause">join</a> clause.</td>
        </tr>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/equals">equals</a></td>
            <td>Contextual keyword in a <a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/join-clause">join</a> clause.</td>
        </tr>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/equals">by</a></td>
            <td>Contextual keyword in a <a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/group-clause">group</a> clause.</td>
        </tr>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/ascending">ascending</a></td>
            <td>Contextual keyword in a <a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/orderby-clause">orderby</a> clause.</td>
        </tr>
        <tr>
            <td><a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/descending">descending</a></td>
            <td>Contextual keyword in a <a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/orderby-clause">orderby</a> clause.</td>
        </tr>
    </tbody>
</table>


