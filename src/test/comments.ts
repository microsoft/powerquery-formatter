// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import "mocha";
import { compare, DefaultFormatSettingsWithMaxWidth, expectFormat } from "./common";

describe("comment serialize", () => {
    // --------------------------------------
    // ---------- RecordExpression ----------
    // --------------------------------------
    describe("RecordExpression", () => {
        it("[ /*foo*/ key1=value1, key2=value2 ]", async () => {
            const expected: string = `
[
    /*foo*/ key1 = value1,
    key2 = value2
]
`;

            const expected2: string = `[/*foo*/ key1 = value1, key2 = value2]`;

            const actual: string = await expectFormat("[ /*foo*/ key1=value1, key2=value2 ]");

            const actual2: string = await expectFormat(
                "[ /*foo*/ key1=value1, key2=value2 ]",
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it("[ /*foo*//*bar*/ key1=value1, key2=value2 ]", async () => {
            const expected: string = `
[
    /*foo*/  /*bar*/ key1 = value1,
    key2 = value2
]
`;

            const expected2: string = `[/*foo*/  /*bar*/ key1 = value1, key2 = value2]`;

            const actual: string = await expectFormat("[ /*foo*//*bar*/ key1=value1, key2=value2 ]");

            const actual2: string = await expectFormat(
                "[ /*foo*//*bar*/ key1=value1, key2=value2 ]",
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it("[ key1=/*foo*/value1, key2=value2 ]", async () => {
            const expected: string = `
[
    key1 = /*foo*/ value1,
    key2 = value2
]
`;

            const expected2: string = `[key1 = /*foo*/ value1, key2 = value2]
`;

            const actual: string = await expectFormat("[ key1=/*foo*/value1, key2=value2 ]");

            const actual2: string = await expectFormat(
                "[ key1=/*foo*/value1, key2=value2 ]",
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it("[ // foo\\n key1=value1 ]", async () => {
            const expected: string = `
[
    // foo
    key1 = value1
]
`;

            const expected2: string = `
[
// foo
key1 = value1]
`;

            const actual: string = await expectFormat("[ // foo\n key1=value1 ]");
            const actual2: string = await expectFormat("[ // foo\n key1=value1 ]", DefaultFormatSettingsWithMaxWidth);
            compare(expected, actual);
            compare(expected2, actual2);
        });

        it("[ // foo\\n // bar \\n key1=value1 ]", async () => {
            const expected: string = `
[
    // foo
    // bar
    key1 = value1
]
`;

            const expected2: string = `
[
// foo
// bar
key1 = value1]
`;

            const actual: string = await expectFormat("[ // foo\n // bar\n key1=value1 ]");

            const actual2: string = await expectFormat(
                "[ // foo\n // bar\n key1=value1 ]",
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it("[ /* foo */ // bar\\n key1=value1 ]", async () => {
            const expected: string = `
[
    /* foo */  // bar
    key1 = value1
]
`;

            const expected2: string = `
[/* foo */  // bar
key1 = value1]
`;

            const actual: string = await expectFormat("[ /* foo */ // bar\n key1=value1 ]");

            const actual2: string = await expectFormat(
                "[ /* foo */ // bar\n key1=value1 ]",
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it("[ /* foo */ // bar\\n /* foobar */ key1=value1 ]", async () => {
            const expected: string = `
[
    /* foo */  // bar
    /* foobar */ key1 = value1
]
`;

            const expected2: string = `
[/* foo */  // bar
/* foobar */ key1 = value1]
`;

            const actual: string = await expectFormat("[ /* foo */ // bar\n /* foobar */ key1=value1 ]");

            const actual2: string = await expectFormat(
                "[ /* foo */ // bar\n /* foobar */ key1=value1 ]",
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it("[ key1 = // foo\\n value1 ]", async () => {
            const expected: string = `
[
    key1 =
    // foo
    value1
]
`;

            const expected2: string = `
[key1 =
// foo
value1]
`;

            const actual: string = await expectFormat("[ key1 = // foo\n value1 ]");
            const actual2: string = await expectFormat("[ key1 = // foo\n value1 ]", DefaultFormatSettingsWithMaxWidth);
            compare(expected, actual);
            compare(expected2, actual2);
        });

        it("[ key1 // foo\\n = value1 ]", async () => {
            const expected: string = `
[
    key1
    // foo
    = value1
]
`;

            const expected2: string = `
[key1
// foo
= value1]
`;

            const actual: string = await expectFormat("[ key1 // foo\n = value1 ]");
            const actual2: string = await expectFormat("[ key1 // foo\n = value1 ]", DefaultFormatSettingsWithMaxWidth);
            compare(expected, actual);
            compare(expected2, actual2);
        });

        it("section foobar; x = 1; // lineComment\n y = 1;", async () => {
            const expected: string = `
section foobar;

x = 1;
// lineComment
y = 1;
`;

            const expected2: string = `
section foobar;

x = 1;
// lineComment
y = 1;
`;

            const actual: string = await expectFormat("section foobar; x = 1; // lineComment\n y = 1;");

            const actual2: string = await expectFormat(
                "section foobar; x = 1; // lineComment\n y = 1;",
                DefaultFormatSettingsWithMaxWidth,
            );

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it("let y = 1 in y // stuff", async () => {
            const expected: string = `
let
    y = 1
in
    y
// stuff
`;

            const expected2: string = `
let y = 1 in y
// stuff
`;

            const actual: string = await expectFormat("let y = 1 in y // stuff");

            const actual2: string = await expectFormat("let y = 1 in y // stuff", DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });

        it("let y = 1 in y /* foo */ ", async () => {
            const expected: string = `
let
    y = 1
in
    y
/* foo */
`;

            const expected2: string = `
let y = 1 in y/* foo */
`;

            const actual: string = await expectFormat("let y = 1 in y /* foo */ ");

            const actual2: string = await expectFormat("let y = 1 in y /* foo */", DefaultFormatSettingsWithMaxWidth);

            compare(expected, actual);
            compare(expected2, actual2);
        });
    });
});
