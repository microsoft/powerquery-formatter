// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import "mocha";
import { compare, expectFormat } from "./common";

describe(`basic serialize`, () => {
    // ------------------------------------------
    // ---------- ArithmeticExpression ----------
    // ------------------------------------------
    describe(`ArithmeticExpression`, () => {
        it(`1 + 2`, () => {
            const expected: string = `1 + 2`;
            const actual: string = expectFormat(`1 + 2`);
            compare(expected, actual);
        });
    });

    // ----------------------------------
    // ---------- AsExpression ----------
    // ----------------------------------
    describe(`AsExpression`, () => {
        it(`1 as number`, () => {
            const expected: string = `1 as number`;
            const actual: string = expectFormat(`1 as number`);
            compare(expected, actual);
        });
    });

    // ------------------------------------
    // ---------- EachExpression ----------
    // ------------------------------------
    describe(`EachExpression`, () => {
        it(`each 1`, () => {
            const expected: string = `each 1`;
            const actual: string = expectFormat(`each 1`);
            compare(expected, actual);
        });

        it(`each {1,2,3}`, () => {
            const expected: string = `
each
    {
        1,
        2,
        3
    }`;
            const actual: string = expectFormat(`each {1,2,3}`);
            compare(expected, actual);
        });

        it(`each if true then 1 else 2`, () => {
            const expected: string = `
each
    if true then
        1
    else
        2`;
            const actual: string = expectFormat(`each if true then 1 else 2`);
            compare(expected, actual);
        });

        it(`each each if true then 1 else 2`, () => {
            const expected: string = `
each
    each
        if true then
            1
        else
            2`;
            const actual: string = expectFormat(`each each if true then 1 else 2`);
            compare(expected, actual);
        });
    });

    // ---------------------------------------------
    // ---------- ErrorHandlingExpression ----------
    // ---------------------------------------------
    describe(`ErrorHandlingExpression`, () => {
        it(`try 1`, () => {
            const expected: string = `try 1`;
            const actual: string = expectFormat(`try 1`);
            compare(expected, actual);
        });

        it(`try 1 otherwise 1`, () => {
            const expected: string = `try 1 otherwise 1`;
            const actual: string = expectFormat(`try 1 otherwise 1`);
            compare(expected, actual);
        });

        it(`try {1, 2}`, () => {
            const expected: string = `
try
    {
        1,
        2
    }`;
            const actual: string = expectFormat(`try {1, 2}`);
            compare(expected, actual);
        });

        it(`try {1, 2} otherwise 1`, () => {
            const expected: string = `
try
    {
        1,
        2
    }
otherwise 1`;
            const actual: string = expectFormat(`try {1, 2} otherwise 1`);
            compare(expected, actual);
        });

        it(`try 1 otherwise {1, 2}`, () => {
            const expected: string = `
try 1
otherwise
    {
        1,
        2
    }`;
            const actual: string = expectFormat(`try 1 otherwise {1, 2}`);
            compare(expected, actual);
        });
    });

    // --------------------------------------------
    // ---------- ErrorRaisingExpression ----------
    // --------------------------------------------
    describe(`ErrorRaisingExpression`, () => {
        it(`error 1`, () => {
            const expected: string = `error 1`;
            const actual: string = expectFormat(`error 1`);
            compare(expected, actual);
        });

        it(`error error 1`, () => {
            const expected: string = `error error 1`;
            const actual: string = expectFormat(`error error 1`);
            compare(expected, actual);
        });

        it(`error {1,2}`, () => {
            const expected: string = `
error {
    1,
    2
}`;
            const actual: string = expectFormat(`error {1,2}`);
            compare(expected, actual);
        });

        it(`error if fn(1,2,3) then 1 else 2`, () => {
            const expected: string = `
error
    if fn(1, 2, 3) then
        1
    else
        2`;
            const actual: string = expectFormat(`error if fn(1,2,3) then 1 else 2`);
            compare(expected, actual);
        });

        it(`error {if true then 1 else 2}`, () => {
            const expected: string = `
error {
    if true then
        1
    else
        2
}`;
            const actual: string = expectFormat(`error {if true then 1 else 2}`);
            compare(expected, actual);
        });
    });

    // -----------------------------------
    // ---------- FieldProjection ----------
    // -----------------------------------
    describe(`FieldProjection`, () => {
        it(`{}[[x]]`, () => {
            const expected: string = `{}[[x]]`;
            const actual: string = expectFormat(`{}[[x]]`);
            compare(expected, actual);
        });

        it(`{}[[x]]?`, () => {
            const expected: string = `{}[[x]]?`;
            const actual: string = expectFormat(`{}[[x]]?`);
            compare(expected, actual);
        });

        it(`{}[[x], [y]]`, () => {
            const expected: string = `{}[[x], [y]]`;
            const actual: string = expectFormat(`{}[[x], [y]]`);
            compare(expected, actual);
        });
    });

    // -----------------------------------
    // ---------- FieldSelector ----------
    // -----------------------------------
    describe(`FieldSelector`, () => {
        it(`[x]`, () => {
            const expected: string = `[x]`;
            const actual: string = expectFormat(`[x]`);
            compare(expected, actual);
        });

        it(`[x]?`, () => {
            const expected: string = `[x]?`;
            const actual: string = expectFormat(`[x]?`);
            compare(expected, actual);
        });
    });

    // ----------------------------------------
    // ---------- FunctionExpression ----------
    // ----------------------------------------
    describe(`FunctionExpression`, () => {
        it(`() => 1`, () => {
            const expected: string = `() => 1`;
            const actual: string = expectFormat(`() => 1`);
            compare(expected, actual);
        });

        it(`() as number => 1`, () => {
            const expected: string = `() as number => 1`;
            const actual: string = expectFormat(`() as number => 1`);
            compare(expected, actual);
        });

        it(`(x) as number => 0`, () => {
            const expected: string = `(x) as number => 0`;
            const actual: string = expectFormat(`(x) as number => 0`);
            compare(expected, actual);
        });

        it(`(x as number) as number => 0`, () => {
            const expected: string = `(x as number) as number => 0`;
            const actual: string = expectFormat(`(x as number) as number => 0`);
            compare(expected, actual);
        });

        it(`(x as type) as number => 0`, () => {
            const expected: string = `(x as type) as number => 0`;
            const actual: string = expectFormat(`(x as type) as number => 0`);
            compare(expected, actual);
        });

        it(`(optional x) => 0`, () => {
            const expected: string = `(optional x) => 0`;
            const actual: string = expectFormat(`(optional x) => 0`);
            compare(expected, actual);
        });

        it(`(optional x as number) => 0`, () => {
            const expected: string = `(optional x as number) => 0`;
            const actual: string = expectFormat(`(optional x as number) => 0`);
            compare(expected, actual);
        });

        it(`(optional x as nullable number) => 0`, () => {
            const expected: string = `(optional x as nullable number) => 0`;
            const actual: string = expectFormat(`(optional x as nullable number) => 0`);
            compare(expected, actual);
        });

        it(`(x, y) => 0`, () => {
            const expected: string = `(x, y) => 0`;
            const actual: string = expectFormat(`(x, y) => 0`);
            compare(expected, actual);
        });

        it(`(x, y as number) => 0`, () => {
            const expected: string = `(x, y as number) => 0`;
            const actual: string = expectFormat(`(x, y as number) => 0`);
            compare(expected, actual);
        });

        it(`(x as number, y) => 0`, () => {
            const expected: string = `(x as number, y) => 0`;
            const actual: string = expectFormat(`(x as number, y) => 0`);
            compare(expected, actual);
        });

        it(`() => {1,2,3}`, () => {
            const expected: string = `
() =>
    {
        1,
        2,
        3
    }`;
            const actual: string = expectFormat(`() => {1,2,3}`);
            compare(expected, actual);
        });
    });

    // ----------------------------------
    // ---------- FunctionType ----------
    // ----------------------------------
    describe(`FunctionType`, () => {
        it(`type function (foo as any) as any`, () => {
            const expected: string = `type function (foo as any) as any`;
            const actual: string = expectFormat(`type function (foo as any) as any`);
            compare(expected, actual);
        });

        it(`type function (foo as any, bar as any) as any`, () => {
            const expected: string = `type function (foo as any, bar as any) as any`;
            const actual: string = expectFormat(`type function (foo as any, bar as any) as any`);
            compare(expected, actual);
        });

        it(`type function (foo as any, optional bar as any) as any`, () => {
            const expected: string = `type function (foo as any, optional bar as any) as any`;
            const actual: string = expectFormat(`type function (foo as any, optional bar as any) as any`);
            compare(expected, actual);
        });
    });

    // -------------------------------------------
    // ---------- GeneralizedIdentifier ----------
    // -------------------------------------------

    describe(`GeneralizedIdentifier`, () => {
        it(`[date]`, () => {
            const expected: string = `[date]`;
            const actual: string = expectFormat(`[date]`);
            compare(expected, actual);
        });

        it(`[foo bar]`, () => {
            const expected: string = `[foo bar]`;
            const actual: string = expectFormat(`[foo bar]`);
            compare(expected, actual);
        });
    });

    // ----------------------------------
    // ---------- IfExpression ----------
    // ----------------------------------
    describe(`IfExpression`, () => {
        it(`if true then true else false`, () => {
            const expected: string = `
if true then
    true
else
    false`;
            const actual: string = expectFormat(`if true then true else false`);
            compare(expected, actual);
        });

        it(`if true then {1,2,3} else [key=value, cat=dog]`, () => {
            const expected: string = `
if true then
    {
        1,
        2,
        3
    }
else
    [
        key = value,
        cat = dog
    ]`;
            const actual: string = expectFormat(`if true then {1,2,3} else [key=value, cat=dog]`);
            compare(expected, actual);
        });

        it(`if true then if true then true else false else false`, () => {
            const expected: string = `
if true then
    if true then
        true
    else
        false
else
    false`;
            const actual: string = expectFormat(`if true then if true then true else false else false`);
            compare(expected, actual);
        });

        it(`if x then x else if x then x else x`, () => {
            const expected: string = `
if x then
    x
else if x then
    x
else
    x`;
            const actual: string = expectFormat(`if x then x else if x then x else x`);
            compare(expected, actual);
        });
    });

    // ----------------------------------
    // ---------- IsExpression ----------
    // ----------------------------------
    describe(`IsExpression`, () => {
        it(`1 is number`, () => {
            const expected: string = `1 is number`;
            const actual: string = expectFormat(`1 is number`);
            compare(expected, actual);
        });
    });

    // ------------------------------------------
    // ---------- ItemAccessExpression ----------
    // ------------------------------------------
    describe(`ItemAccessExpression`, () => {
        it(`Foo{0}`, () => {
            const expected: string = `Foo{0}`;
            const actual: string = expectFormat(`Foo{0}`);
            compare(expected, actual);
        });

        it(`Foo{[X = 1]}`, () => {
            const expected: string = `Foo{[X = 1]}`;
            const actual: string = expectFormat(`Foo{[X = 1]}`);
            compare(expected, actual);
        });

        it(`Foo{[X = 1, Y = 2]}`, () => {
            const expected: string = `
Foo{[
    X = 1,
    Y = 2
]}`;
            const actual: string = expectFormat(`Foo{[X = 1, Y = 2]}`);
            compare(expected, actual);
        });

        it(`Foo{if true then 1 else 2}`, () => {
            const expected: string = `
Foo{
    if true then
        1
    else
        2
}`;
            const actual: string = expectFormat(`Foo{if true then 1 else 2}`);
            compare(expected, actual);
        });
    });

    // --------------------------------------
    // ---------- InvokeExpression ----------
    // --------------------------------------
    describe(`InvokeExpression`, () => {
        it(`Foo()`, () => {
            const expected: string = `Foo()`;
            const actual: string = expectFormat(`Foo()`);
            compare(expected, actual);
        });

        it(`Foo(1)`, () => {
            const expected: string = `Foo(1)`;
            const actual: string = expectFormat(`Foo(1)`);
            compare(expected, actual);
        });

        it(`Foo(let x = 1 in x)`, () => {
            const expected: string = `
Foo(
    let
        x = 1
    in
        x
)`;
            const actual: string = expectFormat(`Foo(let x = 1 in x)`);
            compare(expected, actual);
        });

        it(`Foo(1, 2)`, () => {
            const expected: string = `Foo(1, 2)`;
            const actual: string = expectFormat(`Foo(1, 2)`);
            compare(expected, actual);
        });

        it(`longLinearLength(123456789, 123456789, 123456789, 123456789)`, () => {
            const expected: string = `
longLinearLength(
    123456789,
    123456789,
    123456789,
    123456789
)`;
            const actual: string = expectFormat(`longLinearLength(123456789, 123456789, 123456789, 123456789)`);
            compare(expected, actual);
        });

        it(`#datetimezone(2013, 02, 26, 09, 15, 00, 09, 00)`, () => {
            const expected: string = `#datetimezone(2013, 02, 26, 09, 15, 00, 09, 00)`;
            const actual: string = expectFormat(`#datetimezone(2013, 02, 26, 09, 15, 00, 09, 00)`);
            compare(expected, actual);
        });
    });

    // -----------------------------------
    // ---------- LetExpression ----------
    // -----------------------------------
    describe(`LetExpression`, () => {
        it(`let x = 1 in x`, () => {
            const expected: string = `
let
    x = 1
in
    x`;
            const actual: string = expectFormat(`let x = 1 in x`);
            compare(expected, actual);
        });

        it(`let x = 1, y = 2 in let lst1 = {1,2}, lst2 = {} in {1,2,3}`, () => {
            const expected: string = `
let
    x = 1,
    y = 2
in
    let
        lst1 = {
            1,
            2
        },
        lst2 = {}
    in
        {
            1,
            2,
            3
        }`;
            const actual: string = expectFormat(`let x = 1, y = 2 in let lst1 = {1,2}, lst2 = {} in {1,2,3}`);
            compare(expected, actual);
        });
    });

    // ---------------------------------------
    // ---------- LiteralExpression ----------
    // ---------------------------------------
    describe(`LiteralExpression`, () => {
        it(`true`, () => {
            const expected: string = `true`;
            const actual: string = expectFormat(`true`);
            compare(expected, actual);
        });

        it(`false`, () => {
            const expected: string = `false`;
            const actual: string = expectFormat(`false`);
            compare(expected, actual);
        });

        it(`null`, () => {
            const expected: string = `null`;
            const actual: string = expectFormat(`null`);
            compare(expected, actual);
        });

        it(`1`, () => {
            const expected: string = `1`;
            const actual: string = expectFormat(`1`);
            compare(expected, actual);
        });

        it(`1.2`, () => {
            const expected: string = `1.2`;
            const actual: string = expectFormat(`1.2`);
            compare(expected, actual);
        });

        it(`1.2e1`, () => {
            const expected: string = `1.2e1`;
            const actual: string = expectFormat(`1.2e1`);
            compare(expected, actual);
        });

        it(`.1`, () => {
            const expected: string = `.1`;
            const actual: string = expectFormat(`.1`);
            compare(expected, actual);
        });

        it(`0.1e1`, () => {
            const expected: string = `0.1e1`;
            const actual: string = expectFormat(`0.1e1`);
            compare(expected, actual);
        });

        it(`0x1`, () => {
            const expected: string = `0x1`;
            const actual: string = expectFormat(`0x1`);
            compare(expected, actual);
        });

        it(`0X1`, () => {
            const expected: string = `0X1`;
            const actual: string = expectFormat(`0X1`);
            compare(expected, actual);
        });
    });

    // ------------------------------------
    // ---------- ListExpression ----------
    // ------------------------------------
    describe(`ListExpression`, () => {
        it(`{}`, () => {
            const expected: string = `{}`;
            const actual: string = expectFormat(`{}`);
            compare(expected, actual);
        });

        it(`{1}`, () => {
            const expected: string = `{1}`;
            const actual: string = expectFormat(`{1}`);
            compare(expected, actual);
        });

        it(`{1,2}`, () => {
            const expected: string = `
{
    1,
    2
}`;
            const actual: string = expectFormat(`{1,2}`);
            compare(expected, actual);
        });

        it(`{{}, {}}`, () => {
            const expected: string = `
{
    {},
    {}
}`;
            const actual: string = expectFormat(`{{}, {}}`);
            compare(expected, actual);
        });

        it(`(x) => {x}`, () => {
            const expected: string = `(x) => {x}`;
            const actual: string = expectFormat(`(x) => {x}`);
            compare(expected, actual);
        });

        it(`let x = Foo(1, {2}) in x`, () => {
            const expected: string = `
let
    x = Foo(1, {2})
in
    x`;
            const actual: string = expectFormat(`let x = Foo(1, {2}) in x`);
            compare(expected, actual);
        });

        it(`{0..1}`, () => {
            const expected: string = `{0..1}`;
            const actual: string = expectFormat(`{0..1}`);
            compare(expected, actual);
        });

        it(`{if 1 then 2 else 3..4}`, () => {
            const expected: string = `
{
    if 1 then
        2
    else
        3
    ..
    4
}`;
            const actual: string = expectFormat(`{if 1 then 2 else 3..4}`);
            compare(expected, actual);
        });
    });

    // ------------------------------
    // ---------- ListType ----------
    // ------------------------------
    describe(`ListType`, () => {
        it(`type {any}`, () => {
            const expected: string = `type {any}`;
            const actual: string = expectFormat(`type {any}`);
            compare(expected, actual);
        });

        it(`type { table [ foo, bar ] }`, () => {
            const expected: string = `
type {
    table [
        foo,
        bar
    ]
}`;
            const actual: string = expectFormat(`type { table [ foo, bar ] }`);
            compare(expected, actual);
        });
    });

    // ----------------------------------
    // ---------- NullableType ----------
    // ----------------------------------
    describe(`NullableType`, () => {
        it(`type nullable any`, () => {
            const expected: string = `type nullable any`;
            const actual: string = expectFormat(`type nullable any`);
            compare(expected, actual);
        });

        it(`type nullable table [foo]`, () => {
            const expected: string = `type nullable table [foo]`;
            const actual: string = expectFormat(`type nullable table [foo]`);
            compare(expected, actual);
        });

        it(`type nullable table [foo, bar]`, () => {
            const expected: string = `
type nullable
    table [
        foo,
        bar
    ]`;
            const actual: string = expectFormat(`type nullable table [foo, bar]`);
            compare(expected, actual);
        });
    });

    // ---------------------------------------------
    // ---------- ParenthesizedExpression ----------
    // ---------------------------------------------
    describe(`ParenthesizedExpression`, () => {
        it(`(1)`, () => {
            const expected: string = `(1)`;
            const actual: string = expectFormat(`(1)`);
            compare(expected, actual);
        });

        it(`({1,2})`, () => {
            const expected: string = `
(
    {
        1,
        2
    }
)
`;
            const actual: string = expectFormat(`({1,2})`);
            compare(expected, actual);
        });
    });

    // -----------------------------------
    // ---------- PrimitiveType ----------
    // -----------------------------------
    describe(`PrimitiveType`, () => {
        it(`type any`, () => {
            const expected: string = `type any`;
            const actual: string = expectFormat(`type any`);
            compare(expected, actual);
        });

        it(`type null`, () => {
            const expected: string = `type null`;
            const actual: string = expectFormat(`type null`);
            compare(expected, actual);
        });
    });

    // --------------------------------------
    // ---------- RecordExpression ----------
    // --------------------------------------
    describe(`RecordExpression`, () => {
        it(`[]`, () => {
            const expected: string = `[]`;
            const actual: string = expectFormat(`[]`);
            compare(expected, actual);
        });

        it(`[a=a]`, () => {
            const expected: string = `[a = a]`;
            const actual: string = expectFormat(`[a=a]`);
            compare(expected, actual);
        });

        it(`[a=a,b=b]`, () => {
            const expected: string = `
[
    a = a,
    b = b
]`;
            const actual: string = expectFormat(`[a=a,b=b]`);
            compare(expected, actual);
        });

        it(`[a={},b={}]`, () => {
            const expected: string = `
[
    a = {},
    b = {}
]
`;
            const actual: string = expectFormat(`[a={},b={}]`);
            compare(expected, actual);
        });

        it(`[a={1},b={2}]`, () => {
            const expected: string = `
[
    a = {
        1
    },
    b = {
        2
    }
]`;
            const actual: string = expectFormat(`[a={1},b={2}]`);
            compare(expected, actual);
        });

        it(`(x) => [x=x]`, () => {
            const expected: string = `(x) => [x = x]`;
            const actual: string = expectFormat(`(x) => [x = x]`);
            compare(expected, actual);
        });

        it(`let x = Foo(1, [key = value]) in x`, () => {
            const expected: string = `
let
    x = Foo(1, [key = value])
in
    x`;
            const actual: string = expectFormat(`let x = Foo(1, [key = value]) in x`);
            compare(expected, actual);
        });
    });

    // --------------------------------
    // ---------- RecordType ----------
    // --------------------------------
    describe(`RecordType`, () => {
        it(`type [...]`, () => {
            const expected: string = `type [...]`;
            const actual: string = expectFormat(`type [...]`);
            compare(expected, actual);
        });

        it(`type [foo]`, () => {
            const expected: string = `type [foo]`;
            const actual: string = expectFormat(`type [foo]`);
            compare(expected, actual);
        });

        it(`type [foo, ...]`, () => {
            const expected: string = `
type [
    foo,
    ...
]
`;
            const actual: string = expectFormat(`type [foo, ...]`);
            compare(expected, actual);
        });
    });

    // -------------------------------
    // ---------- TableType ----------
    // -------------------------------
    describe(`TableType`, () => {
        it(`type table foo`, () => {
            const expected: string = `type table foo`;
            const actual: string = expectFormat(`type table foo`);
            compare(expected, actual);
        });

        it(`type table [foo]`, () => {
            const expected: string = `type table [foo]`;
            const actual: string = expectFormat(`type table [foo]`);
            compare(expected, actual);
        });

        it(`type table [optional foo]`, () => {
            const expected: string = `type table [optional foo]`;
            const actual: string = expectFormat(`type table [optional foo]`);
            compare(expected, actual);
        });

        it(`type table [ foo, bar ]`, () => {
            const expected: string = `
type table [
    foo,
    bar
]
`;
            const actual: string = expectFormat(`type table [ foo, bar ]`);
            compare(expected, actual);
        });

        it(`type table [ foo, optional bar ]`, () => {
            const expected: string = `
type table [
    foo,
    optional bar
]
`;
            const actual: string = expectFormat(`type table [ foo, optional bar ]`);
            compare(expected, actual);
        });

        it(`type table [ foo = number ]`, () => {
            const expected: string = `type table [foo = number]`;
            const actual: string = expectFormat(`type table [foo = number]`);
            compare(expected, actual);
        });

        it(`type table [foo = table [key]]`, () => {
            const expected: string = `type table [foo = table [key]]`;
            const actual: string = expectFormat(`type table [foo = table [key]]`);
            compare(expected, actual);
        });

        it(`type table [foo = table [key], bar, optional foobar = number]`, () => {
            const expected: string = `
type table [
    foo = table [key],
    bar,
    optional foobar = number
]`;
            const actual: string = expectFormat(`type table [foo = table [key], bar, optional foobar = number]`);
            compare(expected, actual);
        });
    });

    // --------------------------------------
    // ---------- TBinOpExpression ----------
    // --------------------------------------
    describe(`TBinOpExpression`, () => {
        it(`1 + 2 + 3 + 4 + 5`, () => {
            const expected: string = `1 + 2 + 3 + 4 + 5`;
            const actual: string = expectFormat(`1 + 2 + 3 + 4 + 5`);
            compare(expected, actual);
        });

        it(`aReallyReallyReallyReallyLongIdentifier * aReallyReallyReallyReallyLongIdentifier`, () => {
            const expected: string = `
aReallyReallyReallyReallyLongIdentifier
* aReallyReallyReallyReallyLongIdentifier`;
            const actual: string = expectFormat(
                `aReallyReallyReallyReallyLongIdentifier * aReallyReallyReallyReallyLongIdentifier`,
            );
            compare(expected, actual);
        });

        it(`1 + foo(if true then 1 else 0) + bar (if true then 1 else 0)`, () => {
            const expected: string = `
1
+ foo(
    if true then
        1
    else
        0
)
+ bar(
    if true then
        1
    else
        0
)`;
            const actual: string = expectFormat(`1 + foo(if true then 1 else 0) + bar (if true then 1 else 0)`);
            compare(expected, actual);
        });

        it(`let x = true and true`, () => {
            const expected: string = `
let
    x = true and true
in
    x`;
            const actual: string = expectFormat(`let x = true and true in x`);
            compare(expected, actual);
        });

        it(`let x = 1 <> 2 and 3 <> 4 in x`, () => {
            const expected: string = `
let
    x = 1 <> 2 and 3 <> 4
in
    x`;
            const actual: string = expectFormat(`let x = 1 <> 2 and 3 <> 4 in x`);
            compare(expected, actual);
        });

        it(`true or false and true or true`, () => {
            const expected: string = `true or false and true or true`;
            const actual: string = expectFormat(`true or false and true or true`);
            compare(expected, actual);
        });

        it(`a = true and b = true and c = true`, () => {
            const expected: string = `a = true and b = true and c = true`;
            const actual: string = expectFormat(`a = true and b = true and c = true`);
            compare(expected, actual);
        });

        it(`true and true and (if true then true else false)`, () => {
            const expected: string = `
true and true and (
    if true then
        true
    else
        false
)`;
            const actual: string = expectFormat(`true and true and (if true then true else false)`);
            compare(expected, actual);
        });

        it(`true and (if true then true else false) and true`, () => {
            const expected: string = `
true and (
    if true then
        true
    else
        false
) and true`;
            const actual: string = expectFormat(`true and (if true then true else false) and true`);
            compare(expected, actual);
        });

        it(`(if true then true else false) and true`, () => {
            const expected: string = `
(
    if true then
        true
    else
        false
) and true`;
            const actual: string = expectFormat(`(if true then true else false) and true`);
            compare(expected, actual);
        });
    });

    // -----------------------------------
    // ---------- TBinOpKeyword ----------
    // -----------------------------------
    describe(`TBinOpKeyword`, () => {
        it(`1 as number`, () => {
            const expected: string = `1 as number`;
            const actual: string = expectFormat(`1 as number`);
            compare(expected, actual);
        });

        it(`1 as nullable number`, () => {
            const expected: string = `1 as nullable number`;
            const actual: string = expectFormat(`1 as nullable number`);
            compare(expected, actual);
        });

        it(`1 meta (if 1 then 2 else 3)`, () => {
            const expected: string = `
1
meta
(
    if 1 then
        2
    else
        3
)`;
            const actual: string = expectFormat(`1 meta (if 1 then 2 else 3)`);
            compare(expected, actual);
        });

        it(`{1, 2} as list`, () => {
            const expected: string = `
{
    1,
    2
}
as list`;
            const actual: string = expectFormat(`{1, 2} as list`);
            compare(expected, actual);
        });

        it(`{1, 2} meta (if 1 then 2 else 3)`, () => {
            const expected: string = `
{
    1,
    2
}
meta
(
    if 1 then
        2
    else
        3
)`;
            const actual: string = expectFormat(`{1, 2} meta (if 1 then 2 else 3)`);
            compare(expected, actual);
        });
    });

    // --------------------------
    // ---------- Type ----------
    // --------------------------
    describe(`Type`, () => {
        // check that readType is parsing invoke-expressions
        it(`type table [ Foo = X(), Bar = Y() ]`, () => {
            const expected: string = `
type table [
    Foo = X(),
    Bar = Y()
]`;
            const actual: string = expectFormat(`type table [ Foo = X(), Bar = Y() ]`);
            compare(expected, actual);
        });

        // check that readType is parsing invoke-expressions
        it(`type table [Date accessed = datetimezone]`, () => {
            const expected: string = `type table [Date accessed = datetimezone]`;
            const actual: string = expectFormat(`type table [Date accessed=datetimezone]`);
            compare(expected, actual);
        });
    });

    // --------------------------------------
    // ---------- UnaryExpression ----------
    // --------------------------------------
    describe(`UnaryExpression`, () => {
        it(`-1`, () => {
            const expected: string = `-1`;
            const actual: string = expectFormat(`-1`);
            compare(expected, actual);
        });

        it(`--1`, () => {
            const expected: string = `--1`;
            const actual: string = expectFormat(`--1`);
            compare(expected, actual);
        });

        it(`not 1`, () => {
            const expected: string = `not 1`;
            const actual: string = expectFormat(`not 1`);
            compare(expected, actual);
        });

        it(`not not 1`, () => {
            const expected: string = `not not 1`;
            const actual: string = expectFormat(`not not 1`);
            compare(expected, actual);
        });

        it(`not -1`, () => {
            const expected: string = `not -1`;
            const actual: string = expectFormat(`not -1`);
            compare(expected, actual);
        });

        it(`- not 1`, () => {
            const expected: string = `- not 1`;
            const actual: string = expectFormat(`- not 1`);
            compare(expected, actual);
        });
    });

    // -----------------------------------
    // ---------- mixed nesting ----------
    // -----------------------------------
    describe(`mixed nesting`, () => {
        it(`[foo={},bar={}]`, () => {
            const expected: string = `
[
    foo = {},
    bar = {}
]`;
            const actual: string = expectFormat(`[foo={},bar={}]`);
            compare(expected, actual);
        });

        it(`[first=[insideKey=insideValue,lst={1,2,3},emptyLst={}]]`, () => {
            const expected: string = `
[
    first = [
        insideKey = insideValue,
        lst = {
            1,
            2,
            3
        },
        emptyLst = {}
    ]
]`;
            const actual: string = expectFormat(`[first=[insideKey=insideValue,lst={1,2,3},emptyLst={}]]`);
            compare(expected, actual);
        });
    });
});
