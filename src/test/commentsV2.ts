// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import "mocha";
import { compareV2, DefaultFormatSettings2, expectFormatV2 } from "./common";

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

            const actual: string = await expectFormatV2("[ /*foo*/ key1=value1, key2=value2 ]");

            const actual2: string = await expectFormatV2(
                "[ /*foo*/ key1=value1, key2=value2 ]",
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });

        it("[ /*foo*//*bar*/ key1=value1, key2=value2 ]", async () => {
            const expected: string = `
[
    /*foo*/  /*bar*/ key1 = value1,
    key2 = value2
]
`;

            const expected2: string = `[/*foo*/  /*bar*/ key1 = value1, key2 = value2]`;

            const actual: string = await expectFormatV2("[ /*foo*//*bar*/ key1=value1, key2=value2 ]");

            const actual2: string = await expectFormatV2(
                "[ /*foo*//*bar*/ key1=value1, key2=value2 ]",
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
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

            const actual: string = await expectFormatV2("[ key1=/*foo*/value1, key2=value2 ]");
            const actual2: string = await expectFormatV2("[ key1=/*foo*/value1, key2=value2 ]", DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
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

            const actual: string = await expectFormatV2("[ // foo\n key1=value1 ]");
            const actual2: string = await expectFormatV2("[ // foo\n key1=value1 ]", DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
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

            const actual: string = await expectFormatV2("[ // foo\n // bar\n key1=value1 ]");
            const actual2: string = await expectFormatV2("[ // foo\n // bar\n key1=value1 ]", DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
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

            const actual: string = await expectFormatV2("[ /* foo */ // bar\n key1=value1 ]");
            const actual2: string = await expectFormatV2("[ /* foo */ // bar\n key1=value1 ]", DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
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

            const actual: string = await expectFormatV2("[ /* foo */ // bar\n /* foobar */ key1=value1 ]");

            const actual2: string = await expectFormatV2(
                "[ /* foo */ // bar\n /* foobar */ key1=value1 ]",
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
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

            const actual: string = await expectFormatV2("[ key1 = // foo\n value1 ]");
            const actual2: string = await expectFormatV2("[ key1 = // foo\n value1 ]", DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
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

            const actual: string = await expectFormatV2("[ key1 // foo\n = value1 ]");
            const actual2: string = await expectFormatV2("[ key1 // foo\n = value1 ]", DefaultFormatSettings2);
            compareV2(expected, actual);
            compareV2(expected2, actual2);
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

            const actual: string = await expectFormatV2("section foobar; x = 1; // lineComment\n y = 1;");

            const actual2: string = await expectFormatV2(
                "section foobar; x = 1; // lineComment\n y = 1;",
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
            compareV2(expected2, actual2);
        });
    });
});
