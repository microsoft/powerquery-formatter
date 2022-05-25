// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import "mocha";
import { compareV2, DefaultFormatSettings2, expectFormatV2 } from "./common";

describe(`basic serialize V2`, () => {
    // ------------------------------------------
    // ---------- ArithmeticExpression ----------
    // ------------------------------------------
    describe(`ArithmeticExpression`, () => {
        it(`1 + 2`, async () => {
            const expected: string = `1 + 2`;

            const actual: string = await expectFormatV2(`1 + 2`);
            const actual2: string = await expectFormatV2(`1 + 2`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });
    });

    // ----------------------------------
    // ---------- AsExpression ----------
    // ----------------------------------
    describe(`AsExpression`, () => {
        it(`1 as number`, async () => {
            const expected: string = `
1 as number
`;

            const expected2: string = `1 as number`;

            const actual: string = await expectFormatV2(`1 as number`);
            const actual2: string = await expectFormatV2(`1 as number`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // ------------------------------------
    // ---------- EachExpression ----------
    // ------------------------------------
    describe(`EachExpression`, () => {
        it(`each {1,2,3}`, async () => {
            const expected: string = `
each
    {
        1,
        2,
        3
    }
`;

            const expected2: string = `each { 1, 2, 3 }`;

            const actual: string = await expectFormatV2(`each {1,2,3}`);
            const actual2: string = await expectFormatV2(`each {1,2,3}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`each if true then 1 else 2`, async () => {
            const expected: string = `
each
    if true then
        1
    else
        2
`;

            const expected2: string = `each if true then 1 else 2`;

            const actual: string = await expectFormatV2(`each if true then 1 else 2`);
            const actual2: string = await expectFormatV2(`each if true then 1 else 2`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`each each if true then 1 else 2`, async () => {
            const expected: string = `
each
    each
        if true then
            1
        else
            2
`;

            const expected2: string = `each each if true then 1 else 2`;

            const actual: string = await expectFormatV2(`each each if true then 1 else 2`);
            const actual2: string = await expectFormatV2(`each each if true then 1 else 2`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // ---------------------------------------------
    // ---------- ErrorHandlingExpression ----------
    // ---------------------------------------------
    describe(`ErrorHandlingExpression`, () => {
        it(`try 1`, async () => {
            const expected: string = `
try
    1
`;

            const expected2: string = `try 1`;

            const actual: string = await expectFormatV2(`try 1`);
            const actual2: string = await expectFormatV2(`try 1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`try 1 otherwise 1`, async () => {
            const expected: string = `
try
    1
otherwise
    1
`;

            const expected2: string = `try 1 otherwise 1`;

            const actual: string = await expectFormatV2(`try 1 otherwise 1`);
            const actual2: string = await expectFormatV2(`try 1 otherwise 1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`try {1, 2}`, async () => {
            const expected: string = `
try
    {
        1,
        2
    }
`;

            const expected2: string = `try { 1, 2 }`;

            const actual: string = await expectFormatV2(`try {1, 2}`);
            const actual2: string = await expectFormatV2(`try {1, 2}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`try {1, 2} otherwise 1`, async () => {
            const expected: string = `
try
    {
        1,
        2
    }
otherwise
    1
`;

            const expected2: string = `try { 1, 2 } otherwise 1`;

            const actual: string = await expectFormatV2(`try {1, 2} otherwise 1`);
            const actual2: string = await expectFormatV2(`try {1, 2} otherwise 1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`try 1 otherwise {1, 2}`, async () => {
            const expected: string = `
try
    1
otherwise
    {
        1,
        2
    }
`;

            const expected2: string = `try 1 otherwise { 1, 2 }`;

            const actual: string = await expectFormatV2(`try 1 otherwise {1, 2}`);
            const actual2: string = await expectFormatV2(`try 1 otherwise {1, 2}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // --------------------------------------------
    // ---------- ErrorRaisingExpression ----------
    // --------------------------------------------
    describe(`ErrorRaisingExpression`, () => {
        it(`error 1`, async () => {
            const expected: string = `
error
    1
`;

            const expected2: string = `error 1`;

            const actual: string = await expectFormatV2(`error 1`);
            const actual2: string = await expectFormatV2(`error 1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`error error 1`, async () => {
            const expected: string = `
error
    error
        1
`;

            const expected2: string = `error error 1`;

            const actual: string = await expectFormatV2(`error error 1`);
            const actual2: string = await expectFormatV2(`error error 1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`error {1,2}`, async () => {
            const expected: string = `
error
    {
        1,
        2
    }
`;

            const expected2: string = `error { 1, 2 }`;

            const actual: string = await expectFormatV2(`error {1,2}`);
            const actual2: string = await expectFormatV2(`error {1,2}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`error if fn(1,2,3) then 1 else 2`, async () => {
            const expected: string = `
error
    if fn(
        1,
        2,
        3
    ) then
        1
    else
        2
`;

            const expected2: string = `error if fn( 1, 2, 3 ) then 1 else 2`;

            const actual: string = await expectFormatV2(`error if fn(1,2,3) then 1 else 2`);
            const actual2: string = await expectFormatV2(`error if fn(1,2,3) then 1 else 2`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`error {if true then 1 else 2}`, async () => {
            const expected: string = `
error
    {
        if true then
            1
        else
            2
    }
`;

            const expected2: string = `error { if true then 1 else 2 }`;

            const actual: string = await expectFormatV2(`error {if true then 1 else 2}`);
            const actual2: string = await expectFormatV2(`error {if true then 1 else 2}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // -----------------------------------
    // ---------- FieldProjection ----------
    // -----------------------------------
    describe(`FieldProjection`, () => {
        it(`{}[[x]]`, async () => {
            const expected: string = `
{} [
    [
        x
    ]
]
`;

            const expected2: string = `{} [ [ x ] ]`;

            const actual: string = await expectFormatV2(`{}[[x]]`);
            const actual2: string = await expectFormatV2(`{}[[x]]`, DefaultFormatSettings2);

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`{}[[x]]?`, async () => {
            const expected: string = `
{} [
    [
        x
    ]
] ?
`;

            const expected2: string = `{} [ [ x ] ] ?`;

            const actual: string = await expectFormatV2(`{}[[x]]?`);
            const actual2: string = await expectFormatV2(`{}[[x]]?`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`{}[[x], [y]]`, async () => {
            const expected: string = `
{} [
    [
        x
    ],
    [
        y
    ]
]
`;

            const expected2: string = `{} [ [ x ], [ y ] ]
`;

            const actual: string = await expectFormatV2(`{}[[x], [y]]`);
            const actual2: string = await expectFormatV2(`{}[[x], [y]]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // -----------------------------------
    // ---------- FieldSelector ----------
    // -----------------------------------
    describe(`FieldSelector`, () => {
        it(`[x]`, async () => {
            const expected: string = `[ x ]`;

            const actual: string = await expectFormatV2(`[x]`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it(`[x]?`, async () => {
            const expected: string = `[ x ] ?`;

            const actual: string = await expectFormatV2(`[x]?`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });
    });

    // ----------------------------------------
    // ---------- FunctionExpression ----------
    // ----------------------------------------
    describe(`FunctionExpression`, () => {
        it(`() => 1`, async () => {
            const expected: string = `
() =>
    1
`;

            const expected2: string = `() => 1`;

            const actual: string = await expectFormatV2(`() => 1`);
            const actual2: string = await expectFormatV2(`() => 1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`() as number => 1`, async () => {
            const expected: string = `
() as number =>
    1
`;

            const expected2: string = `() as number => 1`;

            const actual: string = await expectFormatV2(`() as number => 1`);
            const actual2: string = await expectFormatV2(`() as number => 1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`(x) as number => 0`, async () => {
            const expected: string = `
(
    x
) as number =>
    0
`;

            const expected2: string = `( x ) as number => 0`;

            const actual: string = await expectFormatV2(`(x) as number => 0`);
            const actual2: string = await expectFormatV2(`(x) as number => 0`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`(x as number) as number => 0`, async () => {
            const expected: string = `
(
    x as number
) as number =>
    0
`;

            const expected2: string = `( x as number ) as number => 0`;

            const actual: string = await expectFormatV2(`(x as number) as number => 0`);
            const actual2: string = await expectFormatV2(`(x as number) as number => 0`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`(x as type) as number => 0`, async () => {
            const expected: string = `
(
    x as type
) as number =>
    0
`;

            const expected2: string = `( x as type ) as number => 0`;

            const actual: string = await expectFormatV2(`(x as type) as number => 0`);
            const actual2: string = await expectFormatV2(`(x as type) as number => 0`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`(optional x) => 0`, async () => {
            const expected: string = `
(
    optional x
) =>
    0
`;

            const expected2: string = `( optional x ) => 0`;

            const actual: string = await expectFormatV2(`(optional x) => 0`);
            const actual2: string = await expectFormatV2(`(optional x) => 0`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`(optional x as number) => 0`, async () => {
            const expected: string = `
(
    optional x as number
) =>
    0
`;

            const expected2: string = `( optional x as number ) => 0`;

            const actual: string = await expectFormatV2(`(optional x as number) => 0`);
            const actual2: string = await expectFormatV2(`(optional x as number) => 0`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`(optional x as nullable number) => 0`, async () => {
            const expected: string = `
(
    optional x as nullable number
) =>
    0
`;

            const expected2: string = `( optional x as nullable number ) => 0`;

            const actual: string = await expectFormatV2(`(optional x as nullable number) => 0`);

            const actual2: string = await expectFormatV2(
                `(optional x as nullable number) => 0`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`(x, y) => 0`, async () => {
            const expected: string = `
(
    x,
    y
) =>
    0
`;

            const expected2: string = `( x, y ) => 0`;

            const actual: string = await expectFormatV2(`(x, y) => 0`);
            const actual2: string = await expectFormatV2(`(x, y) => 0`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`(x, y as number) => 0`, async () => {
            const expected: string = `
(
    x,
    y as number
) =>
    0
`;

            const expected2: string = `( x, y as number ) => 0`;

            const actual: string = await expectFormatV2(`(x, y as number) => 0`);
            const actual2: string = await expectFormatV2(`(x, y as number) => 0`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`(x as number, y) => 0`, async () => {
            const expected: string = `
(
    x as number,
    y
) =>
    0
`;

            const expected2: string = `( x as number, y ) => 0`;

            const actual: string = await expectFormatV2(`(x as number, y) => 0`);
            const actual2: string = await expectFormatV2(`(x as number, y) => 0`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`() => {1,2,3}`, async () => {
            const expected: string = `
() =>
    {
        1,
        2,
        3
    }
`;

            const expected2: string = `() => { 1, 2, 3 }`;

            const actual: string = await expectFormatV2(`() => {1,2,3}`);
            const actual2: string = await expectFormatV2(`() => {1,2,3}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // ----------------------------------
    // ---------- FunctionType ----------
    // ----------------------------------
    describe(`FunctionType`, () => {
        it(`type function (foo as any) as any`, async () => {
            const expected: string = `
type function (
    foo as any
) as any
`;

            const expected2: string = `type function ( foo as any ) as any`;

            const actual: string = await expectFormatV2(`type function (foo as any) as any`);
            const actual2: string = await expectFormatV2(`type function (foo as any) as any`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`type function (foo as any, bar as any) as any`, async () => {
            const expected: string = `
type function (
    foo as any,
    bar as any
) as any
`;

            const expected2: string = `type function ( foo as any, bar as any ) as any`;

            const actual: string = await expectFormatV2(`type function (foo as any, bar as any) as any`);

            const actual2: string = await expectFormatV2(
                `type function (foo as any, bar as any) as any`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`type function (foo as any, optional bar as any) as any`, async () => {
            const expected: string = `
type function (
    foo as any,
    optional bar as any
) as any
`;

            const expected2: string = `type function ( foo as any, optional bar as any ) as any`;

            const actual: string = await expectFormatV2(`type function (foo as any, optional bar as any) as any`);

            const actual2: string = await expectFormatV2(
                `type function (foo as any, optional bar as any) as any`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // -------------------------------------------
    // ---------- GeneralizedIdentifier ----------
    // -------------------------------------------

    describe(`GeneralizedIdentifier`, () => {
        it(`[date]`, async () => {
            const expected: string = `
[
    date
]
`;

            const expected2: string = `[ date ]`;

            const actual: string = await expectFormatV2(`[date]`);

            const actual2: string = await expectFormatV2(`[date]`, DefaultFormatSettings2);

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`[foo bar]`, async () => {
            const expected: string = `
[
    foo bar
]
`;

            const expected2: string = `[ foo bar ]`;

            const actual: string = await expectFormatV2(`[foo bar]`);

            const actual2: string = await expectFormatV2(`[foo bar]`, DefaultFormatSettings2);

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // ----------------------------------
    // ---------- IfExpression ----------
    // ----------------------------------
    describe(`IfExpression`, () => {
        it(`if true then true else false`, async () => {
            const expected: string = `
if true then
    true
else
    false
`;

            const expected2: string = `if true then true else false`;

            const actual: string = await expectFormatV2(`if true then true else false`);
            const actual2: string = await expectFormatV2(`if true then true else false`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`if true then {1,2,3} else [key=value, cat=dog]`, async () => {
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
    ]
`;

            const expected2: string = `if true then { 1, 2, 3 } else [ key = value, cat = dog ]`;

            const actual: string = await expectFormatV2(`if true then {1,2,3} else [key=value, cat=dog]`);

            const actual2: string = await expectFormatV2(
                `if true then {1,2,3} else [key=value, cat=dog]`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`if true then if true then true else false else false`, async () => {
            const expected: string = `
if true then
    if true then
        true
    else
        false
else
    false
`;

            const expected2: string = `if true then if true then true else false else false`;

            const actual: string = await expectFormatV2(`if true then if true then true else false else false`);

            const actual2: string = await expectFormatV2(
                `if true then if true then true else false else false`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`if x then x else if x then x else x`, async () => {
            const expected: string = `
if x then
    x
else if x then
    x
else
    x
`;

            const expected2: string = `if x then x else if x then x else x`;

            const actual: string = await expectFormatV2(`if x then x else if x then x else x`);

            const actual2: string = await expectFormatV2(`if x then x else if x then x else x`, DefaultFormatSettings2);

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // ----------------------------------
    // ---------- IsExpression ----------
    // ----------------------------------
    describe(`IsExpression`, () => {
        it(`1 is number`, async () => {
            const expected: string = `1 is number`;
            const actual: string = await expectFormatV2(`1 is number`);
            const actual2: string = await expectFormatV2(`1 is number`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });
    });

    // ------------------------------------------
    // ---------- ItemAccessExpression ----------
    // ------------------------------------------
    describe(`ItemAccessExpression`, () => {
        it(`Foo{0}`, async () => {
            const expected: string = `
Foo{
    0
}
`;

            const expected2: string = `Foo{ 0 }`;
            const actual: string = await expectFormatV2(`Foo{0}`);
            const actual2: string = await expectFormatV2(`Foo{0}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`Foo{[X = 1]}`, async () => {
            const expected: string = `
Foo{
    [
        X = 1
    ]
}
`;

            const expected2: string = `Foo{ [ X = 1 ] }`;
            const actual: string = await expectFormatV2(`Foo{[X = 1]}`);
            const actual2: string = await expectFormatV2(`Foo{[X = 1]}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`Foo{[X = 1, Y = 2]}`, async () => {
            const expected: string = `
Foo{
    [
        X = 1,
        Y = 2
    ]
}
`;

            const expected2: string = `Foo{ [ X = 1, Y = 2 ] }`;

            const actual: string = await expectFormatV2(`Foo{[X = 1, Y = 2]}`);
            const actual2: string = await expectFormatV2(`Foo{[X = 1, Y = 2]}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`Foo{if true then 1 else 2}`, async () => {
            const expected: string = `
Foo{
    if true then
        1
    else
        2
}
`;

            const expected2: string = `Foo{ if true then 1 else 2 }`;

            const actual: string = await expectFormatV2(`Foo{if true then 1 else 2}`);
            const actual2: string = await expectFormatV2(`Foo{if true then 1 else 2}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // --------------------------------------
    // ---------- InvokeExpression ----------
    // --------------------------------------
    describe(`InvokeExpression`, () => {
        it(`Foo()`, async () => {
            const expected: string = `
Foo()
`;

            const expected2: string = `Foo()`;
            const actual: string = await expectFormatV2(`Foo()`);
            const actual2: string = await expectFormatV2(`Foo()`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`Foo(1)`, async () => {
            const expected: string = `
Foo(
    1
)
`;

            const expected2: string = `Foo( 1 )`;
            const actual: string = await expectFormatV2(`Foo(1)`);
            const actual2: string = await expectFormatV2(`Foo(1)`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`Foo(let x = 1 in x)`, async () => {
            const expected: string = `
Foo(
    let
        x =
            1
    in
        x
)
`;

            const expected2: string = `Foo( let x = 1 in x )`;
            const actual: string = await expectFormatV2(`Foo(let x = 1 in x)`);
            const actual2: string = await expectFormatV2(`Foo(let x = 1 in x)`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`Foo(1, 2)`, async () => {
            const expected: string = `
Foo(
    1,
    2
)
`;

            const expected2: string = `Foo( 1, 2 )`;
            const actual: string = await expectFormatV2(`Foo(1, 2)`);
            const actual2: string = await expectFormatV2(`Foo(1, 2)`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`longLinearLength(123456789, 123456789, 123456789, 123456789)`, async () => {
            const expected: string = `
longLinearLength(
    123456789,
    123456789,
    123456789,
    123456789
)
`;

            const expected2: string = `longLinearLength( 123456789, 123456789, 123456789, 123456789 )`;
            const actual: string = await expectFormatV2(`longLinearLength(123456789, 123456789, 123456789, 123456789)`);

            const actual2: string = await expectFormatV2(
                `longLinearLength(123456789, 123456789, 123456789, 123456789)`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`#datetimezone(2013, 02, 26, 09, 15, 00, 09, 00)`, async () => {
            const expected: string = `
#datetimezone(
    2013,
    02,
    26,
    09,
    15,
    00,
    09,
    00
)
`;

            const expected2: string = `#datetimezone( 2013, 02, 26, 09, 15, 00, 09, 00 )`;

            const actual: string = await expectFormatV2(`#datetimezone(2013, 02, 26, 09, 15, 00, 09, 00)`);

            const actual2: string = await expectFormatV2(
                `#datetimezone(2013, 02, 26, 09, 15, 00, 09, 00)`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // -----------------------------------
    // ---------- LetExpression ----------
    // -----------------------------------
    describe(`LetExpression`, () => {
        it(`let x = 1 in x`, async () => {
            const expected: string = `
let
    x =
        1
in
    x
`;

            const expected2: string = `let x = 1 in x`;
            const actual: string = await expectFormatV2(`let x = 1 in x`);
            const actual2: string = await expectFormatV2(`let x = 1 in x`, DefaultFormatSettings2);

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`let x = 1, y = 2 in let lst1 = {1,2}, lst2 = {} in {1,2,3}`, async () => {
            const expected: string = `
let
    x =
        1,
    y =
        2
in
    let
        lst1 =
            {
                1,
                2
            },
        lst2 =
            {}
    in
        {
            1,
            2,
            3
        }
`;

            const expected2: string = `let x = 1, y = 2 in let lst1 = { 1, 2 }, lst2 = {} in { 1, 2, 3 }`;
            const actual: string = await expectFormatV2(`let x = 1, y = 2 in let lst1 = {1,2}, lst2 = {} in {1,2,3}`);

            const actual2: string = await expectFormatV2(
                `let x = 1, y = 2 in let lst1 = {1,2}, lst2 = {} in {1,2,3}`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // ---------------------------------------
    // ---------- LiteralExpression ----------
    // ---------------------------------------
    describe(`LiteralExpression`, () => {
        it(`true`, async () => {
            const expected: string = `true`;
            const actual: string = await expectFormatV2(`true`);
            const actual2: string = await expectFormatV2(`true`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`false`, async () => {
            const expected: string = `false`;
            const actual: string = await expectFormatV2(`false`);
            const actual2: string = await expectFormatV2(`false`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`null`, async () => {
            const expected: string = `null`;
            const actual: string = await expectFormatV2(`null`);
            const actual2: string = await expectFormatV2(`null`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`1`, async () => {
            const expected: string = `1`;
            const actual: string = await expectFormatV2(`1`);
            const actual2: string = await expectFormatV2(`1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`1.2`, async () => {
            const expected: string = `1.2`;
            const actual: string = await expectFormatV2(`1.2`);
            const actual2: string = await expectFormatV2(`1.2`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`1.2e1`, async () => {
            const expected: string = `1.2e1`;
            const actual: string = await expectFormatV2(`1.2e1`);
            const actual2: string = await expectFormatV2(`1.2e1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`.1`, async () => {
            const expected: string = `.1`;
            const actual: string = await expectFormatV2(`.1`);
            const actual2: string = await expectFormatV2(`.1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`0.1e1`, async () => {
            const expected: string = `0.1e1`;
            const actual: string = await expectFormatV2(`0.1e1`);
            const actual2: string = await expectFormatV2(`0.1e1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`0x1`, async () => {
            const expected: string = `0x1`;
            const actual: string = await expectFormatV2(`0x1`);
            const actual2: string = await expectFormatV2(`0x1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`0X1`, async () => {
            const expected: string = `0X1`;
            const actual: string = await expectFormatV2(`0X1`);
            const actual2: string = await expectFormatV2(`0X1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });
    });

    // ------------------------------------
    // ---------- ListExpression ----------
    // ------------------------------------
    describe(`ListExpression`, () => {
        it(`{}`, async () => {
            const expected: string = `
{}
`;

            const expected2: string = `{}`;

            const actual: string = await expectFormatV2(`{}`);
            const actual2: string = await expectFormatV2(`{}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`{1}`, async () => {
            const expected: string = `
{
    1
}
`;

            const expected2: string = `{ 1 }`;
            const actual: string = await expectFormatV2(`{1}`);
            const actual2: string = await expectFormatV2(`{1}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`{1,2}`, async () => {
            const expected: string = `
{
    1,
    2
}
`;

            const expected2: string = `{ 1, 2 }`;
            const actual: string = await expectFormatV2(`{1,2}`);
            const actual2: string = await expectFormatV2(`{1,2}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`{{}, {}}`, async () => {
            const expected: string = `
{
    {},
    {}
}
`;

            const expected2: string = `{ {}, {} }`;

            const actual: string = await expectFormatV2(`{{}, {}}`);
            const actual2: string = await expectFormatV2(`{{}, {}}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`(x) => {x}`, async () => {
            const expected: string = `
(
    x
) =>
    {
        x
    }
`;

            const expected2: string = `( x ) => { x }`;

            const actual: string = await expectFormatV2(`(x) => {x}`);
            const actual2: string = await expectFormatV2(`(x) => {x}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`let x = Foo(1, {2}) in x`, async () => {
            const expected: string = `
let
    x =
        Foo(
            1,
            {
                2
            }
        )
in
    x
`;

            const expected2: string = `let x =Foo( 1, { 2 } ) in x`;
            const actual: string = await expectFormatV2(`let x = Foo(1, {2}) in x`);
            const actual2: string = await expectFormatV2(`let x = Foo(1, {2}) in x`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`{0..1}`, async () => {
            const expected: string = `
{
    0..1
}
`;

            const expected2: string = `{ 0..1 }`;
            const actual: string = await expectFormatV2(`{0..1}`);
            const actual2: string = await expectFormatV2(`{0..1}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`{if 1 then 2 else 3..4}`, async () => {
            const expected: string = `
{
    if 1 then
        2
    else
        3
    ..4
}
`;

            const expected2: string = `{ if 1 then 2 else 3..4 }`;
            const actual: string = await expectFormatV2(`{if 1 then 2 else 3..4}`);
            const actual2: string = await expectFormatV2(`{if 1 then 2 else 3..4}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // ------------------------------
    // ---------- ListType ----------
    // ------------------------------
    describe(`ListType`, () => {
        it(`type {any}`, async () => {
            const expected: string = `
type {
    any
}
`;

            const expected2: string = `type { any }`;
            const actual: string = await expectFormatV2(`type {any}`);
            const actual2: string = await expectFormatV2(`type {any}`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`type { table [ foo, bar ] }`, async () => {
            const expected: string = `
type {
    table [
        foo,
        bar
    ]
}
`;

            const expected2: string = `type { table [ foo, bar ] }`;
            const actual: string = await expectFormatV2(`type { table [ foo, bar ] }`);
            const actual2: string = await expectFormatV2(`type { table [ foo, bar ] }`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // ----------------------------------
    // ---------- NullableType ----------
    // ----------------------------------
    describe(`NullableType`, () => {
        it(`type nullable any`, async () => {
            const expected: string = `type nullable any`;
            const actual: string = await expectFormatV2(`type nullable any`);
            const actual2: string = await expectFormatV2(`type nullable any`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`type nullable table [foo]`, async () => {
            const expected: string = `
type nullable table [
    foo
]
`;

            const expected2: string = `type nullable table [ foo ]`;
            const actual: string = await expectFormatV2(`type nullable table [foo]`);
            const actual2: string = await expectFormatV2(`type nullable table [foo]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`type nullable table [foo, bar]`, async () => {
            const expected: string = `
type nullable table [
    foo,
    bar
]
`;

            const expected2: string = `type nullable table [ foo, bar ]`;
            const actual: string = await expectFormatV2(`type nullable table [foo, bar]`);
            const actual2: string = await expectFormatV2(`type nullable table [foo, bar]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // ---------------------------------------------
    // ---------- ParenthesizedExpression ----------
    // ---------------------------------------------
    describe(`ParenthesizedExpression`, () => {
        it(`(1)`, async () => {
            const expected: string = `
(
    1
)
`;

            const expected2: string = `( 1 )`;
            const actual: string = await expectFormatV2(`(1)`);
            const actual2: string = await expectFormatV2(`(1)`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`({1,2})`, async () => {
            const expected: string = `
(
    {
        1,
        2
    }
)
`;

            const expected2: string = `( { 1, 2 } )`;
            const actual: string = await expectFormatV2(`({1,2})`);

            const actual2: string = await expectFormatV2(`({1,2})`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // -----------------------------------
    // ---------- PrimitiveType ----------
    // -----------------------------------
    describe(`PrimitiveType`, () => {
        it(`type any`, async () => {
            const expected: string = `type any`;
            const actual: string = await expectFormatV2(`type any`);
            const actual2: string = await expectFormatV2(`type any`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`type null`, async () => {
            const expected: string = `type null`;
            const actual: string = await expectFormatV2(`type null`);
            const actual2: string = await expectFormatV2(`type null`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });
    });

    // --------------------------------------
    // ---------- RecordExpression ----------
    // --------------------------------------
    describe(`RecordExpression`, () => {
        it(`[]`, async () => {
            const expected: string = `
[]
`;

            const expected2: string = `[]`;
            const actual: string = await expectFormatV2(`[]`);
            const actual2: string = await expectFormatV2(`[]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`[a=a]`, async () => {
            const expected: string = `
[
    a = a
]
`;

            const expected2: string = `[ a = a ]`;
            const actual: string = await expectFormatV2(`[a=a]`);
            const actual2: string = await expectFormatV2(`[a=a]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`[a=a,b=b]`, async () => {
            const expected: string = `
[
    a = a,
    b = b
]
`;

            const expected2: string = `[ a = a, b = b ]`;
            const actual: string = await expectFormatV2(`[a=a,b=b]`);
            const actual2: string = await expectFormatV2(`[a=a,b=b]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`[a={},b={}]`, async () => {
            const expected: string = `
[
    a = {},
    b = {}
]
`;

            const expected2: string = `[ a = {}, b = {} ]`;
            const actual: string = await expectFormatV2(`[a={},b={}]`);
            const actual2: string = await expectFormatV2(`[a={},b={}]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`[a={1},b={2}]`, async () => {
            const expected: string = `
[
    a = {
        1
    },
    b = {
        2
    }
]
`;

            const expected2: string = `[ a = { 1 }, b = { 2 } ]`;
            const actual: string = await expectFormatV2(`[a={1},b={2}]`);
            const actual2: string = await expectFormatV2(`[a={1},b={2}]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`(x) => [x=x]`, async () => {
            const expected: string = `
(
    x
) =>
    [
        x = x
    ]
`;

            const expected2: string = `( x ) => [ x = x ]`;
            const actual: string = await expectFormatV2(`(x) => [x = x]`);
            const actual2: string = await expectFormatV2(`(x) => [x = x]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`let x = Foo(1, [key = value]) in x`, async () => {
            const expected: string = `
let
    x =
        Foo(
            1,
            [
                key =
                    value
            ]
        )
in
    x
`;

            const expected2: string = `let x =Foo( 1, [ key =value ] ) in x`;

            const actual: string = await expectFormatV2(`let x = Foo(1, [key = value]) in x`);
            const actual2: string = await expectFormatV2(`let x = Foo(1, [key = value]) in x`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // --------------------------------
    // ---------- RecordType ----------
    // --------------------------------
    describe(`RecordType`, () => {
        it(`type [...]`, async () => {
            const expected: string = `
type [
    ...
]
`;

            const expected2: string = `type [ ... ]`;
            const actual: string = await expectFormatV2(`type [...]`);
            const actual2: string = await expectFormatV2(`type [...]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`type [foo]`, async () => {
            const expected: string = `
type [
    foo
]
`;

            const expected2: string = `type [ foo ]`;
            const actual: string = await expectFormatV2(`type [foo]`);
            const actual2: string = await expectFormatV2(`type [foo]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`type [foo, ...]`, async () => {
            const expected: string = `
type [
    foo,
    ...
]
`;

            const expected2: string = `type [ foo, ... ]`;
            const actual: string = await expectFormatV2(`type [foo, ...]`);
            const actual2: string = await expectFormatV2(`type [foo, ...]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // -------------------------------
    // ---------- TableType ----------
    // -------------------------------
    describe(`TableType`, () => {
        it(`type table foo`, async () => {
            const expected: string = `type table foo`;
            const actual: string = await expectFormatV2(`type table foo`);
            const actual2: string = await expectFormatV2(`type table foo`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`type table [foo]`, async () => {
            const expected: string = `
type table [
    foo
]
`;

            const expected2: string = `type table [ foo ]`;
            const actual: string = await expectFormatV2(`type table [foo]`);
            const actual2: string = await expectFormatV2(`type table [foo]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`type table [optional foo]`, async () => {
            const expected: string = `
type table [
    optional foo
]
`;

            const expected2: string = `type table [ optional foo ]`;
            const actual: string = await expectFormatV2(`type table [optional foo]`);
            const actual2: string = await expectFormatV2(`type table [optional foo]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`type table [ foo, bar ]`, async () => {
            const expected: string = `
type table [
    foo,
    bar
]
`;

            const expected2: string = `type table [ foo, bar ]`;
            const actual: string = await expectFormatV2(`type table [ foo, bar ]`);
            const actual2: string = await expectFormatV2(`type table [ foo, bar ]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`type table [ foo, optional bar ]`, async () => {
            const expected: string = `
type table [
    foo,
    optional bar
]
`;

            const expected2: string = `type table [ foo, optional bar ]`;
            const actual: string = await expectFormatV2(`type table [ foo, optional bar ]`);
            const actual2: string = await expectFormatV2(`type table [ foo, optional bar ]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`type table [ foo = number ]`, async () => {
            const expected: string = `
type table [
    foo = number
]
`;

            const expected2: string = `type table [ foo = number ]`;
            const actual: string = await expectFormatV2(`type table [foo = number]`);
            const actual2: string = await expectFormatV2(`type table [foo = number]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`type table [foo = table [key]]`, async () => {
            const expected: string = `
type table [
    foo = table [
        key
    ]
]
`;

            const expected2: string = `type table [ foo = table [ key ] ]`;
            const actual: string = await expectFormatV2(`type table [foo = table [key]]`);
            const actual2: string = await expectFormatV2(`type table [foo = table [key]]`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`type table [foo = table [key], bar, optional foobar = number]`, async () => {
            const expected: string = `
type table [
    foo = table [
        key
    ],
    bar,
    optional foobar = number
]
`;

            const expected2: string = `type table [ foo = table [ key ], bar, optional foobar = number ]`;

            const actual: string = await expectFormatV2(
                `type table [foo = table [key], bar, optional foobar = number]`,
            );

            const actual2: string = await expectFormatV2(
                `type table [foo = table [key], bar, optional foobar = number]`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // --------------------------------------
    // ---------- TBinOpExpression ----------
    // --------------------------------------
    describe(`TBinOpExpression`, () => {
        it(`1 + 2 + 3 + 4 + 5`, async () => {
            const expected: string = `1 + 2 + 3 + 4 + 5`;
            const expected2: string = `1 + 2 + 3 + 4 + 5`;
            const actual: string = await expectFormatV2(`1 + 2 + 3 + 4 + 5`);
            const actual2: string = await expectFormatV2(`1 + 2 + 3 + 4 + 5`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`aReallyReallyReallyReallyLongIdentifier * aReallyReallyReallyReallyLongIdentifier`, async () => {
            const expected: string = `
aReallyReallyReallyReallyLongIdentifier * aReallyReallyReallyReallyLongIdentifier
`;

            const expected2: string = `aReallyReallyReallyReallyLongIdentifier * aReallyReallyReallyReallyLongIdentifier`;

            const actual: string = await expectFormatV2(
                `aReallyReallyReallyReallyLongIdentifier * aReallyReallyReallyReallyLongIdentifier`,
            );

            const actual2: string = await expectFormatV2(
                `aReallyReallyReallyReallyLongIdentifier * aReallyReallyReallyReallyLongIdentifier`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`1 + foo(if true then 1 else 0) + bar (if true then 1 else 0)`, async () => {
            const expected: string = `
1 + foo(
    if true then
        1
    else
        0
) + bar(
    if true then
        1
    else
        0
)
`;

            const expected2: string = `1 + foo( if true then 1 else 0 ) + bar( if true then 1 else 0 )`;

            const actual: string = await expectFormatV2(`1 + foo(if true then 1 else 0) + bar (if true then 1 else 0)`);

            const actual2: string = await expectFormatV2(
                `1 + foo(if true then 1 else 0) + bar (if true then 1 else 0)`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`let x = true and true`, async () => {
            const expected: string = `
let
    x =
        true and true
in
    x
`;

            const expected2: string = `let x = true and true in x`;

            const actual: string = await expectFormatV2(`let x = true and true in x`);
            const actual2: string = await expectFormatV2(`let x = true and true in x`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`let x = 1 <> 2 and 3 <> 4 in x`, async () => {
            const expected: string = `
let
    x =
        1 <> 2 and 3 <> 4
in
    x
`;

            const expected2: string = `let x = 1 <> 2 and 3 <> 4 in x`;

            const actual: string = await expectFormatV2(`let x = 1 <> 2 and 3 <> 4 in x`);
            const actual2: string = await expectFormatV2(`let x = 1 <> 2 and 3 <> 4 in x`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`true or false and true or true`, async () => {
            const expected: string = `true or false and true or true`;
            const actual: string = await expectFormatV2(`true or false and true or true`);
            const actual2: string = await expectFormatV2(`true or false and true or true`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`a = true and b = true and c = true`, async () => {
            const expected: string = `a = true and b = true and c = true`;
            const actual: string = await expectFormatV2(`a = true and b = true and c = true`);
            const actual2: string = await expectFormatV2(`a = true and b = true and c = true`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`true and true and (if true then true else false)`, async () => {
            const expected: string = `
true and true and (
    if true then
        true
    else
        false
)
`;

            const expected2: string = `true and true and ( if true then true else false )`;

            const actual: string = await expectFormatV2(`true and true and (if true then true else false)`);

            const actual2: string = await expectFormatV2(
                `true and true and (if true then true else false)`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`true and (if true then true else false) and true`, async () => {
            const expected: string = `
true and (
    if true then
        true
    else
        false
)
and true
`;

            const expected2: string = `true and ( if true then true else false ) and true`;

            const actual: string = await expectFormatV2(`true and (if true then true else false) and true`);

            const actual2: string = await expectFormatV2(
                `true and (if true then true else false) and true`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`(if true then true else false) and true`, async () => {
            const expected: string = `
(
    if true then
        true
    else
        false
)
and true
`;

            const expected2: string = `( if true then true else false ) and true`;

            const actual: string = await expectFormatV2(`(if true then true else false) and true`);

            const actual2: string = await expectFormatV2(
                `(if true then true else false) and true`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // -----------------------------------
    // ---------- TBinOpKeyword ----------
    // -----------------------------------
    describe(`TBinOpKeyword`, () => {
        it(`1 as number`, async () => {
            const expected: string = `
1 as number
`;

            const expected2: string = `1 as number`;
            const actual: string = await expectFormatV2(`1 as number`);
            const actual2: string = await expectFormatV2(`1 as number`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`1 as nullable number`, async () => {
            const expected: string = `
1 as nullable number
`;

            const expected2: string = `1 as nullable number`;
            const actual: string = await expectFormatV2(`1 as nullable number`);
            const actual2: string = await expectFormatV2(`1 as nullable number`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`1 meta (if 1 then 2 else 3)`, async () => {
            const expected: string = `
1 meta (
    if 1 then
        2
    else
        3
)
`;

            const expected2: string = `1 meta ( if 1 then 2 else 3 )`;
            const actual: string = await expectFormatV2(`1 meta (if 1 then 2 else 3)`);
            const actual2: string = await expectFormatV2(`1 meta (if 1 then 2 else 3)`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`{1, 2} as list`, async () => {
            const expected: string = `
{
    1,
    2
} as list
`;

            const expected2: string = `{ 1, 2 } as list`;
            const actual: string = await expectFormatV2(`{1, 2} as list`);
            const actual2: string = await expectFormatV2(`{1, 2} as list`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`{1, 2} meta (if 1 then 2 else 3)`, async () => {
            const expected: string = `
{
    1,
    2
} meta (
    if 1 then
        2
    else
        3
)
`;

            const expected2: string = `{ 1, 2 } meta ( if 1 then 2 else 3 )`;
            const actual: string = await expectFormatV2(`{1, 2} meta (if 1 then 2 else 3)`);
            const actual2: string = await expectFormatV2(`{1, 2} meta (if 1 then 2 else 3)`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // --------------------------
    // ---------- Type ----------
    // --------------------------
    describe(`Type`, () => {
        // check that readType is parsing invoke-expressions
        it(`type table [ Foo = X(), Bar = Y() ]`, async () => {
            const expected: string = `
type table [
    Foo = X(),
    Bar = Y()
]
`;

            const expected2: string = `type table [ Foo = X(), Bar = Y() ]`;
            const actual2: string = await expectFormatV2(`type table [ Foo = X(), Bar = Y() ]`, DefaultFormatSettings2);
            const actual: string = await expectFormatV2(`type table [ Foo = X(), Bar = Y() ]`);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        // check that readType is parsing invoke-expressions
        it(`type table [Date accessed = datetimezone]`, async () => {
            const expected: string = `
type table [
    Date accessed = datetimezone
]
`;

            const expected2: string = `type table [ Date accessed = datetimezone ]`;
            const actual: string = await expectFormatV2(`type table [Date accessed=datetimezone]`);

            const actual2: string = await expectFormatV2(
                `type table [Date accessed=datetimezone]`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });

    // --------------------------------------
    // ---------- UnaryExpression ----------
    // --------------------------------------
    describe(`UnaryExpression`, () => {
        it(`-1`, async () => {
            const expected: string = `-1`;
            const actual: string = await expectFormatV2(`-1`);
            const actual2: string = await expectFormatV2(`-1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`--1`, async () => {
            const expected: string = `--1`;
            const actual: string = await expectFormatV2(`--1`);
            const actual2: string = await expectFormatV2(`--1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`not 1`, async () => {
            const expected: string = `not 1`;
            const actual: string = await expectFormatV2(`not 1`);
            const actual2: string = await expectFormatV2(`not 1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`not not 1`, async () => {
            const expected: string = `not not 1`;
            const actual: string = await expectFormatV2(`not not 1`);
            const actual2: string = await expectFormatV2(`not not 1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`not -1`, async () => {
            const expected: string = `not -1`;
            const actual: string = await expectFormatV2(`not -1`);
            const actual2: string = await expectFormatV2(`not -1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });

        it(`- not 1`, async () => {
            const expected: string = `- not 1`;
            const actual: string = await expectFormatV2(`- not 1`);
            const actual2: string = await expectFormatV2(`- not 1`, DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected, actual2);
        });
    });

    // -----------------------------------
    // ---------- mixed nesting ----------
    // -----------------------------------
    describe(`mixed nesting`, () => {
        it(`[foo={},bar={}]`, async () => {
            const expected: string = `
[
    foo = {},
    bar = {}
]
`;

            const expected2: string = `[ foo = {}, bar = {} ]`;

            const actual: string = await expectFormatV2(`[foo={},bar={}]`);
            const actual2: string = await expectFormatV2(`[foo={},bar={}]`, DefaultFormatSettings2);

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it(`[first=[insideKey=insideValue,lst={1,2,3},emptyLst={}]]`, async () => {
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
]
`;

            const expected2: string = `[ first = [ insideKey = insideValue, lst = { 1, 2, 3 }, emptyLst = {} ] ]`;

            const actual: string = await expectFormatV2(`[first=[insideKey=insideValue,lst={1,2,3},emptyLst={}]]`);

            const actual2: string = await expectFormatV2(
                `[first=[insideKey=insideValue,lst={1,2,3},emptyLst={}]]`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });
});
