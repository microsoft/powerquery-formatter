// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import "mocha";
import { compare, DefaultFormatSettingsWithMaxWidth, expectFormat } from "./common";

describe(`basic serialize`, () => {
    // ------------------------------------------
    // ---------- ArithmeticExpression ----------
    // ------------------------------------------
    describe(`ArithmeticExpression`, () => {
        it(`1 + 2`, async () => {
            const expected: string = `1 + 2`;

            const actual: string = await expectFormat(`1 + 2`);
            const actual2: string = await expectFormat(`1 + 2`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
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

            const actual: string = await expectFormat(`1 as number`);
            const actual2: string = await expectFormat(`1 as number`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `each {1, 2, 3}`;

            const actual: string = await expectFormat(`each {1,2,3}`);
            const actual2: string = await expectFormat(`each {1,2,3}`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const actual: string = await expectFormat(`each if true then 1 else 2`);
            const actual2: string = await expectFormat(`each if true then 1 else 2`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const actual: string = await expectFormat(`each each if true then 1 else 2`);

            const actual2: string = await expectFormat(
                `each each if true then 1 else 2`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
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

            const actual: string = await expectFormat(`try 1`);
            const actual2: string = await expectFormat(`try 1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`try 1 otherwise 1`, async () => {
            const expected: string = `
try
    1
otherwise
    1
`;

            const expected2: string = `try 1 otherwise 1`;

            const actual: string = await expectFormat(`try 1 otherwise 1`);
            const actual2: string = await expectFormat(`try 1 otherwise 1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`try {1, 2}`, async () => {
            const expected: string = `
try
    {
        1,
        2
    }
`;

            const expected2: string = `try {1, 2}`;

            const actual: string = await expectFormat(`try {1, 2}`);
            const actual2: string = await expectFormat(`try {1, 2}`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `try {1, 2} otherwise 1`;

            const actual: string = await expectFormat(`try {1, 2} otherwise 1`);
            const actual2: string = await expectFormat(`try {1, 2} otherwise 1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `try 1 otherwise {1, 2}`;

            const actual: string = await expectFormat(`try 1 otherwise {1, 2}`);
            const actual2: string = await expectFormat(`try 1 otherwise {1, 2}`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const actual: string = await expectFormat(`error 1`);
            const actual2: string = await expectFormat(`error 1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`error error 1`, async () => {
            const expected: string = `
error
    error
        1
`;

            const expected2: string = `error error 1`;

            const actual: string = await expectFormat(`error error 1`);
            const actual2: string = await expectFormat(`error error 1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`error {1,2}`, async () => {
            const expected: string = `
error
    {
        1,
        2
    }
`;

            const expected2: string = `error {1, 2}`;

            const actual: string = await expectFormat(`error {1,2}`);
            const actual2: string = await expectFormat(`error {1,2}`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `error if fn(1, 2, 3) then 1 else 2`;

            const actual: string = await expectFormat(`error if fn(1,2,3) then 1 else 2`);

            const actual2: string = await expectFormat(
                `error if fn(1,2,3) then 1 else 2`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `error {if true then 1 else 2}`;

            const actual: string = await expectFormat(`error {if true then 1 else 2}`);

            const actual2: string = await expectFormat(
                `error {if true then 1 else 2}`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });
    });

    // -----------------------------------
    // ---------- FieldProjection ----------
    // -----------------------------------
    describe(`FieldProjection`, () => {
        it(`{}[[x]]`, async () => {
            const expected: string = `
{}[
    [
        x
    ]
]
`;

            const expected2: string = `{}[[x]]`;

            const actual: string = await expectFormat(`{}[[x]]`);
            const actual2: string = await expectFormat(`{}[[x]]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`{}[[x]]?`, async () => {
            const expected: string = `
{}[
    [
        x
    ]
]?
`;

            const expected2: string = `{}[[x]]?`;

            const actual: string = await expectFormat(`{}[[x]]?`);
            const actual2: string = await expectFormat(`{}[[x]]?`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`{}[[x], [y]]`, async () => {
            const expected: string = `
{}[
    [
        x
    ],
    [
        y
    ]
]
`;

            const expected2: string = `{}[[x], [y]]`;

            const actual: string = await expectFormat(`{}[[x], [y]]`);
            const actual2: string = await expectFormat(`{}[[x], [y]]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });
    });

    // -----------------------------------
    // ---------- FieldSelector ----------
    // -----------------------------------
    describe(`FieldSelector`, () => {
        it(`[x]`, async () => {
            const expected: string = `[x]`;

            const actual: string = await expectFormat(`[x]`, DefaultFormatSettingsWithMaxWidth);
            compare(expected, actual);
        });

        it(`[x]?`, async () => {
            const expected: string = `[x]?`;

            const actual: string = await expectFormat(`[x]?`, DefaultFormatSettingsWithMaxWidth);
            compare(expected, actual);
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

            const actual: string = await expectFormat(`() => 1`);
            const actual2: string = await expectFormat(`() => 1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`() as number => 1`, async () => {
            const expected: string = `
() as number =>
    1
`;

            const expected2: string = `() as number => 1`;

            const actual: string = await expectFormat(`() as number => 1`);
            const actual2: string = await expectFormat(`() as number => 1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`(x) as number => 0`, async () => {
            const expected: string = `
(
    x
) as number =>
    0
`;

            const expected2: string = `(x) as number => 0`;

            const actual: string = await expectFormat(`(x) as number => 0`);
            const actual2: string = await expectFormat(`(x) as number => 0`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`(x as number) as number => 0`, async () => {
            const expected: string = `
(
    x as number
) as number =>
    0
`;

            const expected2: string = `(x as number) as number => 0`;

            const actual: string = await expectFormat(`(x as number) as number => 0`);

            const actual2: string = await expectFormat(
                `(x as number) as number => 0`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`(x as type) as number => 0`, async () => {
            const expected: string = `
(
    x as type
) as number =>
    0
`;

            const expected2: string = `(x as type) as number => 0`;

            const actual: string = await expectFormat(`(x as type) as number => 0`);
            const actual2: string = await expectFormat(`(x as type) as number => 0`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`(optional x) => 0`, async () => {
            const expected: string = `
(
    optional x
) =>
    0
`;

            const expected2: string = `(optional x) => 0`;

            const actual: string = await expectFormat(`(optional x) => 0`);
            const actual2: string = await expectFormat(`(optional x) => 0`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`(optional x as number) => 0`, async () => {
            const expected: string = `
(
    optional x as number
) =>
    0
`;

            const expected2: string = `(optional x as number) => 0`;

            const actual: string = await expectFormat(`(optional x as number) => 0`);

            const actual2: string = await expectFormat(
                `(optional x as number) => 0`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`(optional x as nullable number) => 0`, async () => {
            const expected: string = `
(
    optional x as nullable number
) =>
    0
`;

            const expected2: string = `(optional x as nullable number) => 0`;

            const actual: string = await expectFormat(`(optional x as nullable number) => 0`);

            const actual2: string = await expectFormat(
                `(optional x as nullable number) => 0`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`(x, y) => 0`, async () => {
            const expected: string = `
(
    x,
    y
) =>
    0
`;

            const expected2: string = `(x, y) => 0`;

            const actual: string = await expectFormat(`(x, y) => 0`);
            const actual2: string = await expectFormat(`(x, y) => 0`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`(x, y as number) => 0`, async () => {
            const expected: string = `
(
    x,
    y as number
) =>
    0
`;

            const expected2: string = `(x, y as number) => 0`;

            const actual: string = await expectFormat(`(x, y as number) => 0`);
            const actual2: string = await expectFormat(`(x, y as number) => 0`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`(x as number, y) => 0`, async () => {
            const expected: string = `
(
    x as number,
    y
) =>
    0
`;

            const expected2: string = `(x as number, y) => 0`;

            const actual: string = await expectFormat(`(x as number, y) => 0`);
            const actual2: string = await expectFormat(`(x as number, y) => 0`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `() => {1, 2, 3}`;

            const actual: string = await expectFormat(`() => {1,2,3}`);
            const actual2: string = await expectFormat(`() => {1,2,3}`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `type function (foo as any) as any`;

            const actual: string = await expectFormat(`type function (foo as any) as any`);

            const actual2: string = await expectFormat(
                `type function (foo as any) as any`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`type function (foo as any, bar as any) as any`, async () => {
            const expected: string = `
type function (
    foo as any,
    bar as any
) as any
`;

            const expected2: string = `type function (foo as any, bar as any) as any`;

            const actual: string = await expectFormat(`type function (foo as any, bar as any) as any`);

            const actual2: string = await expectFormat(
                `type function (foo as any, bar as any) as any`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`type function (foo as any, optional bar as any) as any`, async () => {
            const expected: string = `
type function (
    foo as any,
    optional bar as any
) as any
`;

            const expected2: string = `type function (foo as any, optional bar as any) as any`;

            const actual: string = await expectFormat(`type function (foo as any, optional bar as any) as any`);

            const actual2: string = await expectFormat(
                `type function (foo as any, optional bar as any) as any`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `[date]`;

            const actual: string = await expectFormat(`[date]`);
            const actual2: string = await expectFormat(`[date]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`[foo bar]`, async () => {
            const expected: string = `
[
    foo bar
]
`;

            const expected2: string = `[foo bar]`;

            const actual: string = await expectFormat(`[foo bar]`);

            const actual2: string = await expectFormat(`[foo bar]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const actual: string = await expectFormat(`if true then true else false`);

            const actual2: string = await expectFormat(
                `if true then true else false`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `if true then {1, 2, 3} else [key = value, cat = dog]`;

            const actual: string = await expectFormat(`if true then {1,2,3} else [key=value, cat=dog]`);

            const actual2: string = await expectFormat(
                `if true then {1,2,3} else [key=value, cat=dog]`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
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

            const actual: string = await expectFormat(`if true then if true then true else false else false`);

            const actual2: string = await expectFormat(
                `if true then if true then true else false else false`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
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

            const actual: string = await expectFormat(`if x then x else if x then x else x`);

            const actual2: string = await expectFormat(
                `if x then x else if x then x else x`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });
    });

    // ----------------------------------
    // ---------- IsExpression ----------
    // ----------------------------------
    describe(`IsExpression`, () => {
        it(`1 is number`, async () => {
            const expected: string = `1 is number`;
            const actual: string = await expectFormat(`1 is number`);
            const actual2: string = await expectFormat(`1 is number`, DefaultFormatSettingsWithMaxWidth);
            compare(expected, actual);
            compare(expected, actual2);
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

            const expected2: string = `Foo{0}`;
            const actual: string = await expectFormat(`Foo{0}`);
            const actual2: string = await expectFormat(`Foo{0}`, DefaultFormatSettingsWithMaxWidth);
            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`Foo{[X = 1]}`, async () => {
            const expected: string = `
Foo{
    [
        X = 1
    ]
}
`;

            const expected2: string = `Foo{[X = 1]}`;
            const actual: string = await expectFormat(`Foo{[X = 1]}`);
            const actual2: string = await expectFormat(`Foo{[X = 1]}`, DefaultFormatSettingsWithMaxWidth);
            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `Foo{[X = 1, Y = 2]}`;

            const actual: string = await expectFormat(`Foo{[X = 1, Y = 2]}`);
            const actual2: string = await expectFormat(`Foo{[X = 1, Y = 2]}`, DefaultFormatSettingsWithMaxWidth);
            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `Foo{if true then 1 else 2}`;

            const actual: string = await expectFormat(`Foo{if true then 1 else 2}`);
            const actual2: string = await expectFormat(`Foo{if true then 1 else 2}`, DefaultFormatSettingsWithMaxWidth);
            compare(expected, actual);
            compare(expected2, actual2);
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
            const actual: string = await expectFormat(`Foo()`);
            const actual2: string = await expectFormat(`Foo()`, DefaultFormatSettingsWithMaxWidth);
            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`Foo(1)`, async () => {
            const expected: string = `
Foo(
    1
)
`;

            const expected2: string = `Foo(1)`;

            const actual: string = await expectFormat(`Foo(1)`);
            const actual2: string = await expectFormat(`Foo(1)`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`Foo(let x = 1 in x)`, async () => {
            const expected: string = `
Foo(
    let
        x = 1
    in
        x
)
`;

            const expected2: string = `Foo(let x = 1 in x)`;
            const actual: string = await expectFormat(`Foo(let x = 1 in x)`);
            const actual2: string = await expectFormat(`Foo(let x = 1 in x)`, DefaultFormatSettingsWithMaxWidth);
            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`Foo(1, 2)`, async () => {
            const expected: string = `
Foo(
    1,
    2
)
`;

            const expected2: string = `Foo(1, 2)`;

            const actual: string = await expectFormat(`Foo(1, 2)`);
            const actual2: string = await expectFormat(`Foo(1, 2)`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `longLinearLength(123456789, 123456789, 123456789, 123456789)`;
            const actual: string = await expectFormat(`longLinearLength(123456789, 123456789, 123456789, 123456789)`);

            const actual2: string = await expectFormat(
                `longLinearLength(123456789, 123456789, 123456789, 123456789)`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `#datetimezone(2013, 02, 26, 09, 15, 00, 09, 00)`;

            const actual: string = await expectFormat(`#datetimezone(2013, 02, 26, 09, 15, 00, 09, 00)`);

            const actual2: string = await expectFormat(
                `#datetimezone(2013, 02, 26, 09, 15, 00, 09, 00)`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });
    });

    // -----------------------------------
    // ---------- LetExpression ----------
    // -----------------------------------
    describe(`LetExpression`, () => {
        it(`let x = 1 in x`, async () => {
            const expected: string = `
let
    x = 1
in
    x
`;

            const expected2: string = `let x = 1 in x`;

            const actual: string = await expectFormat(`let x = 1 in x`);
            const actual2: string = await expectFormat(`let x = 1 in x`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`let x = 1, y = 2 in let lst1 = {1,2}, lst2 = {} in {1,2,3}`, async () => {
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
        }
`;

            const expected2: string = `let x = 1, y = 2 in let lst1 = {1, 2}, lst2 = {} in {1, 2, 3}`;
            const actual: string = await expectFormat(`let x = 1, y = 2 in let lst1 = {1,2}, lst2 = {} in {1,2,3}`);

            const actual2: string = await expectFormat(
                `let x = 1, y = 2 in let lst1 = {1,2}, lst2 = {} in {1,2,3}`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });
    });

    // ---------------------------------------
    // ---------- LiteralExpression ----------
    // ---------------------------------------
    describe(`LiteralExpression`, () => {
        it(`true`, async () => {
            const expected: string = `true`;

            const actual: string = await expectFormat(`true`);
            const actual2: string = await expectFormat(`true`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`false`, async () => {
            const expected: string = `false`;

            const actual: string = await expectFormat(`false`);
            const actual2: string = await expectFormat(`false`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`null`, async () => {
            const expected: string = `null`;

            const actual: string = await expectFormat(`null`);
            const actual2: string = await expectFormat(`null`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`1`, async () => {
            const expected: string = `1`;

            const actual: string = await expectFormat(`1`);
            const actual2: string = await expectFormat(`1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`1.2`, async () => {
            const expected: string = `1.2`;

            const actual: string = await expectFormat(`1.2`);
            const actual2: string = await expectFormat(`1.2`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`1.2e1`, async () => {
            const expected: string = `1.2e1`;

            const actual: string = await expectFormat(`1.2e1`);
            const actual2: string = await expectFormat(`1.2e1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`.1`, async () => {
            const expected: string = `.1`;

            const actual: string = await expectFormat(`.1`);
            const actual2: string = await expectFormat(`.1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`0.1e1`, async () => {
            const expected: string = `0.1e1`;

            const actual: string = await expectFormat(`0.1e1`);
            const actual2: string = await expectFormat(`0.1e1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`0x1`, async () => {
            const expected: string = `0x1`;

            const actual: string = await expectFormat(`0x1`);
            const actual2: string = await expectFormat(`0x1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`0X1`, async () => {
            const expected: string = `0X1`;

            const actual: string = await expectFormat(`0X1`);
            const actual2: string = await expectFormat(`0X1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
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

            const actual: string = await expectFormat(`{}`);
            const actual2: string = await expectFormat(`{}`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`{1}`, async () => {
            const expected: string = `
{
    1
}
`;

            const expected2: string = `{1}`;

            const actual: string = await expectFormat(`{1}`);
            const actual2: string = await expectFormat(`{1}`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`{1,2}`, async () => {
            const expected: string = `
{
    1,
    2
}
`;

            const expected2: string = `{1, 2}`;

            const actual: string = await expectFormat(`{1,2}`);
            const actual2: string = await expectFormat(`{1,2}`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`{{}, {}}`, async () => {
            const expected: string = `
{
    {},
    {}
}
`;

            const expected2: string = `{{}, {}}`;

            const actual: string = await expectFormat(`{{}, {}}`);
            const actual2: string = await expectFormat(`{{}, {}}`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `(x) => {x}`;

            const actual: string = await expectFormat(`(x) => {x}`);
            const actual2: string = await expectFormat(`(x) => {x}`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`let x = Foo(1, {2}) in x`, async () => {
            const expected: string = `
let
    x = Foo(
        1,
        {
            2
        }
    )
in
    x
`;

            const expected2: string = `let x = Foo(1, {2}) in x`;

            const actual: string = await expectFormat(`let x = Foo(1, {2}) in x`);
            const actual2: string = await expectFormat(`let x = Foo(1, {2}) in x`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`{0..1}`, async () => {
            const expected: string = `
{
    0..1
}
`;

            const expected2: string = `{0..1}`;

            const actual: string = await expectFormat(`{0..1}`);
            const actual2: string = await expectFormat(`{0..1}`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`{if 1 then 2 else 3..4}`, async () => {
            const expected: string = `
{
    if 1 then
        2
    else
        3..4
}
`;

            const expected2: string = `{if 1 then 2 else 3..4}`;

            const actual: string = await expectFormat(`{if 1 then 2 else 3..4}`);
            const actual2: string = await expectFormat(`{if 1 then 2 else 3..4}`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `type {any}`;

            const actual: string = await expectFormat(`type {any}`);
            const actual2: string = await expectFormat(`type {any}`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `type {table [foo, bar]}`;

            const actual: string = await expectFormat(`type { table [ foo, bar ] }`);

            const actual2: string = await expectFormat(
                `type { table [ foo, bar ] }`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });
    });

    // ----------------------------------
    // ---------- NullableType ----------
    // ----------------------------------
    describe(`NullableType`, () => {
        it(`type nullable any`, async () => {
            const expected: string = `type nullable any`;

            const actual: string = await expectFormat(`type nullable any`);
            const actual2: string = await expectFormat(`type nullable any`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`type nullable table [foo]`, async () => {
            const expected: string = `
type nullable table [
    foo
]
`;

            const expected2: string = `type nullable table [foo]`;

            const actual: string = await expectFormat(`type nullable table [foo]`);
            const actual2: string = await expectFormat(`type nullable table [foo]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`type nullable table [foo, bar]`, async () => {
            const expected: string = `
type nullable table [
    foo,
    bar
]
`;

            const expected2: string = `type nullable table [foo, bar]`;

            const actual: string = await expectFormat(`type nullable table [foo, bar]`);

            const actual2: string = await expectFormat(
                `type nullable table [foo, bar]`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `(1)`;

            const actual: string = await expectFormat(`(1)`);
            const actual2: string = await expectFormat(`(1)`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `({1, 2})`;

            const actual: string = await expectFormat(`({1,2})`);
            const actual2: string = await expectFormat(`({1,2})`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });
    });

    // -----------------------------------
    // ---------- PrimitiveType ----------
    // -----------------------------------
    describe(`PrimitiveType`, () => {
        it(`type any`, async () => {
            const expected: string = `type any`;

            const actual: string = await expectFormat(`type any`);
            const actual2: string = await expectFormat(`type any`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`type null`, async () => {
            const expected: string = `type null`;

            const actual: string = await expectFormat(`type null`);
            const actual2: string = await expectFormat(`type null`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
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

            const actual: string = await expectFormat(`[]`);
            const actual2: string = await expectFormat(`[]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`[a=a]`, async () => {
            const expected: string = `
[
    a = a
]
`;

            const expected2: string = `[a = a]`;

            const actual: string = await expectFormat(`[a=a]`);
            const actual2: string = await expectFormat(`[a=a]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`[a=a,b=b]`, async () => {
            const expected: string = `
[
    a = a,
    b = b
]
`;

            const expected2: string = `[a = a, b = b]`;

            const actual: string = await expectFormat(`[a=a,b=b]`);
            const actual2: string = await expectFormat(`[a=a,b=b]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`[a={},b={}]`, async () => {
            const expected: string = `
[
    a = {},
    b = {}
]
`;

            const expected2: string = `[a = {}, b = {}]`;

            const actual: string = await expectFormat(`[a={},b={}]`);
            const actual2: string = await expectFormat(`[a={},b={}]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `[a = {1}, b = {2}]`;

            const actual: string = await expectFormat(`[a={1},b={2}]`);
            const actual2: string = await expectFormat(`[a={1},b={2}]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `(x) => [x = x]`;

            const actual: string = await expectFormat(`(x) => [x = x]`);
            const actual2: string = await expectFormat(`(x) => [x = x]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`let x = Foo(1, [key = value]) in x`, async () => {
            const expected: string = `
let
    x = Foo(
        1,
        [
            key = value
        ]
    )
in
    x
`;

            const expected2: string = `let x = Foo(1, [key = value]) in x`;

            const actual: string = await expectFormat(`let x = Foo(1, [key = value]) in x`);

            const actual2: string = await expectFormat(
                `let x = Foo(1, [key = value]) in x`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`Record item should honor prepending Line Feed `, async () => {
            const target: string = `[Version = "1.0.0"]
section MultipleAuthKindConnector;

[DataSource.Kind = "MultipleAuthKindConnector"]
shared MultipleAuthKindConnector.Connects = ()=> Extension.CurrentCredential()[AuthenticationKind];

MultipleAuthKindConnector = [
    Authentication = [
        Key = [],
        UsernamePassword = [],
        Windows = [],
        Anonymous = []        
    ]
];`;

            const expected: string = `
[
    Version = "1.0.0"
]
section MultipleAuthKindConnector;

[
    DataSource.Kind = "MultipleAuthKindConnector"
]
shared MultipleAuthKindConnector.Connects = () =>
    Extension.CurrentCredential()[
        AuthenticationKind
    ];

MultipleAuthKindConnector = [
    Authentication = [
        Key = [],
        UsernamePassword = [],
        Windows = [],
        Anonymous = []
    ]
];
`;

            const expected2: string = `
[Version = "1.0.0"]
section MultipleAuthKindConnector;

[DataSource.Kind = "MultipleAuthKindConnector"]
shared MultipleAuthKindConnector.Connects = () => Extension.CurrentCredential()[AuthenticationKind];

MultipleAuthKindConnector = [
    Authentication = [
        Key = [],
        UsernamePassword = [],
        Windows = [],
        Anonymous = []
    ]
];`;

            const actual: string = await expectFormat(target);
            const actual2: string = await expectFormat(target, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });
    });

    it(`Record should honor its content length v1`, async () => {
        const target: string = `(optional options as record) as table =>
    let
      Concat = (list) => List.Accumulate(list, null, (x, y) => if x = null then y else [Kind = "Binary", Operator = "Concatenate", Left = x, Right = y])
    in
      Concat`;

        const expected: string = `
(
    optional options as record
) as table =>
    let
        Concat = (
            list
        ) =>
            List.Accumulate(
                list,
                null,
                (
                    x,
                    y
                ) =>
                    if
                        x = null
                    then
                        y
                    else
                        [
                            Kind = "Binary",
                            Operator = "Concatenate",
                            Left = x,
                            Right = y
                        ]
            )
    in
        Concat
`;

        const expected2: string = `
(optional options as record) as table =>
    let
        Concat = (list) =>
            List.Accumulate(
                list,
                null,
                (x, y) => if x = null then y else [Kind = "Binary", Operator = "Concatenate", Left = x, Right = y]
            )
    in
        Concat
`;

        const actual2: string = await expectFormat(target, DefaultFormatSettingsWithMaxWidth);
        const actual: string = await expectFormat(target);

        compare(expected, actual);
        compare(expected2, actual2);
    });

    it(`Record should honor its content length v2`, async () => {
        const target: string = `(code) =>
    let
        Response = Web.Contents(
            "https://github.com/login/oauth/access_token",
            [
                Content = Text.ToBinary(
                    Uri.BuildQueryString(
                        [ client_id = client_id, client_secret = client_secret, code = code, redirect_uri = redirect_uri]
                    )
                ),
                Headers = [#"Content-type" = "application/x-www-form-urlencoded", Accept = "application/json"]
            ]
        ),
        Parts = Json.Document(Response)
    in
        Parts`;

        const expected: string = `
(
    code
) =>
    let
        Response = Web.Contents(
            "https://github.com/login/oauth/access_token",
            [
                Content = Text.ToBinary(
                    Uri.BuildQueryString(
                        [
                            client_id = client_id,
                            client_secret = client_secret,
                            code = code,
                            redirect_uri = redirect_uri
                        ]
                    )
                ),
                Headers = [
                    #"Content-type" = "application/x-www-form-urlencoded",
                    Accept = "application/json"
                ]
            ]
        ),
        Parts = Json.Document(
            Response
        )
    in
        Parts
`;

        const expected2: string = `
(code) =>
    let
        Response = Web.Contents(
            "https://github.com/login/oauth/access_token",
            [
                Content = Text.ToBinary(
                    Uri.BuildQueryString(
                        [
                            client_id = client_id,
                            client_secret = client_secret,
                            code = code,
                            redirect_uri = redirect_uri
                        ]
                    )
                ),
                Headers = [#"Content-type" = "application/x-www-form-urlencoded", Accept = "application/json"]
            ]
        ),
        Parts = Json.Document(Response)
    in
        Parts
`;

        const actual2: string = await expectFormat(target, DefaultFormatSettingsWithMaxWidth);
        const actual: string = await expectFormat(target);

        compare(expected, actual);
        compare(expected2, actual2);
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

            const expected2: string = `type [...]`;

            const actual: string = await expectFormat(`type [...]`);
            const actual2: string = await expectFormat(`type [...]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`type [foo]`, async () => {
            const expected: string = `
type [
    foo
]
`;

            const expected2: string = `type [foo]`;

            const actual: string = await expectFormat(`type [foo]`);
            const actual2: string = await expectFormat(`type [foo]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`type [foo, ...]`, async () => {
            const expected: string = `
type [
    foo,
    ...
]
`;

            const expected2: string = `type [foo, ...]`;

            const actual: string = await expectFormat(`type [foo, ...]`);
            const actual2: string = await expectFormat(`type [foo, ...]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });
    });

    // -------------------------------
    // ---------- TableType ----------
    // -------------------------------
    describe(`TableType`, () => {
        it(`type table foo`, async () => {
            const expected: string = `type table foo`;

            const actual: string = await expectFormat(`type table foo`);
            const actual2: string = await expectFormat(`type table foo`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`type table [foo]`, async () => {
            const expected: string = `
type table [
    foo
]
`;

            const expected2: string = `type table [foo]`;

            const actual: string = await expectFormat(`type table [foo]`);
            const actual2: string = await expectFormat(`type table [foo]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`type table [optional foo]`, async () => {
            const expected: string = `
type table [
    optional foo
]
`;

            const expected2: string = `type table [optional foo]`;

            const actual: string = await expectFormat(`type table [optional foo]`);
            const actual2: string = await expectFormat(`type table [optional foo]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`type table [ foo, bar ]`, async () => {
            const expected: string = `
type table [
    foo,
    bar
]
`;

            const expected2: string = `type table [foo, bar]`;

            const actual: string = await expectFormat(`type table [ foo, bar ]`);
            const actual2: string = await expectFormat(`type table [ foo, bar ]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`type table [ foo, optional bar ]`, async () => {
            const expected: string = `
type table [
    foo,
    optional bar
]
`;

            const expected2: string = `type table [foo, optional bar]`;

            const actual: string = await expectFormat(`type table [ foo, optional bar ]`);

            const actual2: string = await expectFormat(
                `type table [ foo, optional bar ]`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`type table [ foo = number ]`, async () => {
            const expected: string = `
type table [
    foo = number
]
`;

            const expected2: string = `type table [foo = number]`;

            const actual: string = await expectFormat(`type table [foo = number]`);
            const actual2: string = await expectFormat(`type table [foo = number]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`type table [foo = table [key]]`, async () => {
            const expected: string = `
type table [
    foo = table [
        key
    ]
]
`;

            const expected2: string = `type table [foo = table [key]]`;

            const actual: string = await expectFormat(`type table [foo = table [key]]`);

            const actual2: string = await expectFormat(
                `type table [foo = table [key]]`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `type table [foo = table [key], bar, optional foobar = number]`;

            const actual: string = await expectFormat(`type table [foo = table [key], bar, optional foobar = number]`);

            const actual2: string = await expectFormat(
                `type table [foo = table [key], bar, optional foobar = number]`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });
    });

    // --------------------------------------
    // ---------- TBinOpExpression ----------
    // --------------------------------------
    describe(`TBinOpExpression`, () => {
        it(`1 + 2 + 3 + 4 + 5`, async () => {
            const expected: string = `1 + 2 + 3 + 4 + 5`;
            const expected2: string = `1 + 2 + 3 + 4 + 5`;

            const actual: string = await expectFormat(`1 + 2 + 3 + 4 + 5`);
            const actual2: string = await expectFormat(`1 + 2 + 3 + 4 + 5`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`aReallyReallyReallyReallyLongIdentifier * aReallyReallyReallyReallyLongIdentifier`, async () => {
            const expected: string = `
aReallyReallyReallyReallyLongIdentifier * aReallyReallyReallyReallyLongIdentifier
`;

            const expected2: string = `aReallyReallyReallyReallyLongIdentifier * aReallyReallyReallyReallyLongIdentifier`;

            const actual: string = await expectFormat(
                `aReallyReallyReallyReallyLongIdentifier * aReallyReallyReallyReallyLongIdentifier`,
            );

            const actual2: string = await expectFormat(
                `aReallyReallyReallyReallyLongIdentifier * aReallyReallyReallyReallyLongIdentifier`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `1 + foo(if true then 1 else 0) + bar(if true then 1 else 0)`;

            const actual: string = await expectFormat(`1 + foo(if true then 1 else 0) + bar (if true then 1 else 0)`);

            const actual2: string = await expectFormat(
                `1 + foo(if true then 1 else 0) + bar (if true then 1 else 0)`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`let x = true and true`, async () => {
            const expected: string = `
let
    x =
        true
        and true
in
    x
`;

            const expected2: string = `let x = true and true in x`;

            const actual: string = await expectFormat(`let x = true and true in x`);
            const actual2: string = await expectFormat(`let x = true and true in x`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`let x = 1 <> 2 and 3 <> 4 in x`, async () => {
            const expected: string = `
let
    x =
        1 <> 2
        and 3 <> 4
in
    x
`;

            const expected2: string = `let x = 1 <> 2 and 3 <> 4 in x`;

            const actual: string = await expectFormat(`let x = 1 <> 2 and 3 <> 4 in x`);

            const actual2: string = await expectFormat(
                `let x = 1 <> 2 and 3 <> 4 in x`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`true or false and true or true`, async () => {
            const expected: string = `
true
or false
and true
or true
`;

            const expected2: string = `true or false and true or true`;

            const actual: string = await expectFormat(`true or false and true or true`);

            const actual2: string = await expectFormat(
                `true or false and true or true`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`a = true and b = true and c = true`, async () => {
            const expected: string = `
a = true
and b = true
and c = true
`;

            const expected2: string = `a = true and b = true and c = true`;

            const actual: string = await expectFormat(`a = true and b = true and c = true`);

            const actual2: string = await expectFormat(
                `a = true and b = true and c = true`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`true and true and (if true then true else false)`, async () => {
            const expected: string = `
true
and true
and (
    if true then
        true
    else
        false
)
`;

            const expected2: string = `true and true and (if true then true else false)`;

            const actual: string = await expectFormat(`true and true and (if true then true else false)`);

            const actual2: string = await expectFormat(
                `true and true and (if true then true else false)`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`true and (if true then true else false) and true`, async () => {
            const expected: string = `
true
and (
    if true then
        true
    else
        false
)
and true
`;

            const expected2: string = `true and (if true then true else false) and true`;

            const actual: string = await expectFormat(`true and (if true then true else false) and true`);

            const actual2: string = await expectFormat(
                `true and (if true then true else false) and true`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `(if true then true else false) and true`;

            const actual: string = await expectFormat(`(if true then true else false) and true`);

            const actual2: string = await expectFormat(
                `(if true then true else false) and true`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
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

            const actual: string = await expectFormat(`1 as number`);
            const actual2: string = await expectFormat(`1 as number`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`1 as nullable number`, async () => {
            const expected: string = `
1 as nullable number
`;

            const expected2: string = `1 as nullable number`;

            const actual: string = await expectFormat(`1 as nullable number`);
            const actual2: string = await expectFormat(`1 as nullable number`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `1 meta (if 1 then 2 else 3)`;

            const actual: string = await expectFormat(`1 meta (if 1 then 2 else 3)`);

            const actual2: string = await expectFormat(
                `1 meta (if 1 then 2 else 3)`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it(`{1, 2} as list`, async () => {
            const expected: string = `
{
    1,
    2
} as list
`;

            const expected2: string = `{1, 2} as list`;

            const actual: string = await expectFormat(`{1, 2} as list`);
            const actual2: string = await expectFormat(`{1, 2} as list`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `{1, 2} meta (if 1 then 2 else 3)`;
            const actual: string = await expectFormat(`{1, 2} meta (if 1 then 2 else 3)`);

            const actual2: string = await expectFormat(
                `{1, 2} meta (if 1 then 2 else 3)`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `type table [Foo = X(), Bar = Y()]`;

            const actual2: string = await expectFormat(
                `type table [ Foo = X(), Bar = Y() ]`,
                DefaultFormatSettingsWithMaxWidth,
            );

            const actual: string = await expectFormat(`type table [ Foo = X(), Bar = Y() ]`);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        // check that readType is parsing invoke-expressions
        it(`type table [Date accessed = datetimezone]`, async () => {
            const expected: string = `
type table [
    Date accessed = datetimezone
]
`;

            const expected2: string = `type table [Date accessed = datetimezone]`;
            const actual: string = await expectFormat(`type table [Date accessed=datetimezone]`);

            const actual2: string = await expectFormat(
                `type table [Date accessed=datetimezone]`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });
    });

    // --------------------------------------
    // ---------- UnaryExpression ----------
    // --------------------------------------
    describe(`UnaryExpression`, () => {
        it(`-1`, async () => {
            const expected: string = `-1`;

            const actual: string = await expectFormat(`-1`);
            const actual2: string = await expectFormat(`-1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`--1`, async () => {
            const expected: string = `--1`;

            const actual: string = await expectFormat(`--1`);
            const actual2: string = await expectFormat(`--1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`not 1`, async () => {
            const expected: string = `not 1`;

            const actual: string = await expectFormat(`not 1`);
            const actual2: string = await expectFormat(`not 1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`not not 1`, async () => {
            const expected: string = `not not 1`;

            const actual: string = await expectFormat(`not not 1`);
            const actual2: string = await expectFormat(`not not 1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`not -1`, async () => {
            const expected: string = `not -1`;

            const actual: string = await expectFormat(`not -1`);
            const actual2: string = await expectFormat(`not -1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
        });

        it(`- not 1`, async () => {
            const expected: string = `- not 1`;

            const actual: string = await expectFormat(`- not 1`);
            const actual2: string = await expectFormat(`- not 1`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected, actual2);
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

            const expected2: string = `[foo = {}, bar = {}]`;

            const actual: string = await expectFormat(`[foo={},bar={}]`);
            const actual2: string = await expectFormat(`[foo={},bar={}]`, DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
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

            const expected2: string = `[first = [insideKey = insideValue, lst = {1, 2, 3}, emptyLst = {}]]`;

            const actual: string = await expectFormat(`[first=[insideKey=insideValue,lst={1,2,3},emptyLst={}]]`);

            const actual2: string = await expectFormat(
                `[first=[insideKey=insideValue,lst={1,2,3},emptyLst={}]]`,
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });
    });
});
