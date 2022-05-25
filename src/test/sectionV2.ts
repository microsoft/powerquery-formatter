// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import "mocha";
import { compareV2, DefaultFormatSettings2, expectFormatV2 } from "./common";

describe("section", () => {
    describe("Section", () => {
        it("section;", async () => {
            const expected: string = `section;`;
            const actual: string = await expectFormatV2(`section;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("section name;", async () => {
            const expected: string = `section name;`;
            const actual: string = await expectFormatV2(`section name;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("[] section name;", async () => {
            const expected: string = `
[ ]
section name;
`;

            const actual: string = await expectFormatV2(`[] section name;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("[] section;", async () => {
            const expected: string = `
[ ]
section;
`;

            const actual: string = await expectFormatV2(`[] section;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("[a = 1] section;", async () => {
            const expected: string = `
[ a = 1 ]
section;
`;

            const actual: string = await expectFormatV2(`[a = 1] section;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("[a = {}] section;", async () => {
            const expected: string = `
[ a = {} ]
section;
`;

            const actual: string = await expectFormatV2(`[a = {}] section;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("[a = 1, b = 2] section;", async () => {
            const expected: string = `
[ a = 1, b = 2 ]
section;
`;

            const actual: string = await expectFormatV2(`[a=1, b=2] section;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("[a = {}, b = {}] section;", async () => {
            const expected: string = `
[ a = {}, b = {} ]
section;
`;

            const actual: string = await expectFormatV2(`[a = {}, b = {}] section;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("[a = {1}, b = {2}] section;", async () => {
            const expected: string = `
[ a = { 1 }, b = { 2 } ]
section;
`;

            const actual: string = await expectFormatV2(`[a = {1}, b = {2}] section;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("[a = 1, b = [c = {2, 3, 4}], e = 5] section;", async () => {
            const expected: string = `
[ a = 1, b = [ c = { 2, 3, 4 } ], e = 5 ]
section;
`;

            const actual: string = await expectFormatV2(
                `[a = 1, b = [c = {2, 3, 4}], e = 5] section;`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
        });
    });

    describe("SectionMember", () => {
        it("section; x = 1;", async () => {
            const expected: string = `
section;

x = 1;
`;

            const actual: string = await expectFormatV2(`section; x = 1;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("section; [] x = 1;", async () => {
            const expected: string = `
section;

[] x = 1;
`;

            const actual: string = await expectFormatV2(`section; [] x = 1;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("section; [a=1, b=2] x = 1;", async () => {
            const expected: string = `
section;

[ a = 1, b = 2 ] x = 1;
`;

            const actual: string = await expectFormatV2(`section; [a=1, b=2] x = 1;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("section; [a=1, b=2] shared x = 1;", async () => {
            const expected: string = `
section;

[ a = 1, b = 2 ]
shared x = 1;
`;

            const actual: string = await expectFormatV2(`section; [a=1, b=2] shared x = 1;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("section; [a = 1] x = 1;", async () => {
            const expected: string = `
section;

[ a = 1 ] x = 1;
`;

            const actual: string = await expectFormatV2(`section; [a = 1] x = 1;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("section; [a = 1] shared x = 1;", async () => {
            const expected: string = `
section;

[ a = 1 ]
shared x = 1;
`;

            const actual: string = await expectFormatV2(`section; [a = 1] shared x = 1;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("section; x = 1; y = 2;", async () => {
            const expected: string = `
section;

x = 1;
y = 2;
`;

            const actual: string = await expectFormatV2(`section; x = 1; y = 2;`, DefaultFormatSettings2);
            compareV2(expected, actual);
        });

        it("section; Other = 3; Constant.Alpha = 1; Constant.Beta = 2; Other = 3;", async () => {
            const expected: string = `
section;

Other = 3;
Constant.Alpha = 1;
Constant.Beta = 2;
Other = 3;
`;

            const actual: string = await expectFormatV2(
                `section; Other = 3; Constant.Alpha = 1; Constant.Beta = 2; Other = 3;`,
                DefaultFormatSettings2,
            );

            compareV2(expected, actual);
        });
    });
});
