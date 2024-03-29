// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import "mocha";
import { compare, expectFormat } from "./common";

describe("section", () => {
    describe("Section", () => {
        it("section;", async () => {
            const expected: string = `section;`;
            const actual: string = await expectFormat(`section;`);
            compare(expected, actual);
        });

        it("section name;", async () => {
            const expected: string = `section name;`;
            const actual: string = await expectFormat(`section name;`);
            compare(expected, actual);
        });

        it("[] section name;", async () => {
            const expected: string = `
[]
section name;
`;

            const actual: string = await expectFormat(`[] section name;`);
            compare(expected, actual);
        });

        it("[] section;", async () => {
            const expected: string = `
[]
section;
`;

            const actual: string = await expectFormat(`[] section;`);
            compare(expected, actual);
        });

        it("[a = 1] section;", async () => {
            const expected: string = `
[a = 1]
section;
`;

            const actual: string = await expectFormat(`[a = 1] section;`);
            compare(expected, actual);
        });

        it("[a = {}] section;", async () => {
            const expected: string = `
[a = {}]
section;
`;

            const actual: string = await expectFormat(`[a = {}] section;`);
            compare(expected, actual);
        });

        it("[a = 1, b = 2] section;", async () => {
            const expected: string = `
[a = 1, b = 2]
section;
`;

            const actual: string = await expectFormat(`[a=1, b=2] section;`);
            compare(expected, actual);
        });

        it("[a = {}, b = {}] section;", async () => {
            const expected: string = `
[a = {}, b = {}]
section;
`;

            const actual: string = await expectFormat(`[a = {}, b = {}] section;`);
            compare(expected, actual);
        });

        it("[a = {1}, b = {2}] section;", async () => {
            const expected: string = `
[a = {1}, b = {2}]
section;
`;

            const actual: string = await expectFormat(`[a = {1}, b = {2}] section;`);
            compare(expected, actual);
        });

        it("[a = 1, b = [c = {2, 3, 4}], e = 5] section;", async () => {
            const expected: string = `
[a = 1, b = [c = {2, 3, 4}], e = 5]
section;
`;

            const actual: string = await expectFormat(`[a = 1, b = [c = {2, 3, 4}], e = 5] section;`);

            compare(expected, actual);
        });
    });

    describe("SectionMember", () => {
        it("section; x = 1;", async () => {
            const expected: string = `
section;

x = 1;
`;

            const actual: string = await expectFormat(`section; x = 1;`);
            compare(expected, actual);
        });

        it("section; [] x = 1;", async () => {
            const expected: string = `
section;

[] x = 1;
`;

            const actual: string = await expectFormat(`section; [] x = 1;`);
            compare(expected, actual);
        });

        it("section; [a=1, b=2] x = 1;", async () => {
            const expected: string = `
section;

[a = 1, b = 2] x = 1;
`;

            const actual: string = await expectFormat(`section; [a=1, b=2] x = 1;`);
            compare(expected, actual);
        });

        it("section; [a=1, b=2] shared x = 1;", async () => {
            const expected: string = `
section;

[a = 1, b = 2]
shared x = 1;
`;

            const actual: string = await expectFormat(`section; [a=1, b=2] shared x = 1;`);

            compare(expected, actual);
        });

        it("section; [a = 1] x = 1;", async () => {
            const expected: string = `
section;

[a = 1] x = 1;
`;

            const actual: string = await expectFormat(`section; [a = 1] x = 1;`);
            compare(expected, actual);
        });

        it("section; [a = 1] shared x = 1;", async () => {
            const expected: string = `
section;

[a = 1]
shared x = 1;
`;

            const actual: string = await expectFormat(`section; [a = 1] shared x = 1;`);

            compare(expected, actual);
        });

        it("section; x = 1; y = 2;", async () => {
            const expected: string = `
section;

x = 1;
y = 2;
`;

            const actual: string = await expectFormat(`section; x = 1; y = 2;`);
            compare(expected, actual);
        });

        it("section; Other = 3; Constant.Alpha = 1; Constant.Beta = 2; Other = 3;", async () => {
            const expected: string = `
section;

Other = 3;

Constant.Alpha = 1;
Constant.Beta = 2;

Other = 3;
`;

            const actual: string = await expectFormat(
                `section; Other = 3; Constant.Alpha = 1; Constant.Beta = 2; Other = 3;`,
            );

            compare(expected, actual);
        });

        it("Lengthy record in section", async () => {
            const expected: string = `
[Version = "1.1.0"]
section UserVoice;

SuggestionsTable =
    let
        descriptor = #table(
            {
                {
                    false,
                    "category",
                    "category_id",
                    type nullable Int64.Type,
                    {
                        [
                            operator = "Equals",
                            value = (value) => if value is null then "uncategorized" else Text.From(value)
                        ]
                    }
                }
            }
        )
    in
        descriptor;
`;

            const actual: string = await expectFormat(
                `[Version="1.1.0"]
section UserVoice;

SuggestionsTable = let
    descriptor = #table(
        {
            {
                false,
                "category",
                "category_id",
                type nullable Int64.Type,
                {[operator = "Equals", value = (value) => if value is null then "uncategorized" else Text.From(value)]}
            }
        }
    )
in
    descriptor;
`,
            );

            compare(expected, actual);
        });
    });
});
