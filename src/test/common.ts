// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expect } from "chai";
import "mocha";

import { FormatSettings, IndentationLiteral, NewlineLiteral, TriedFormat, tryFormat } from "..";

const DefaultFormatSettings: FormatSettings = {
    locale: PQP.Locale.en_US,
    parser: PQP.Parser.CombinatorialParser,
    indentationLiteral: IndentationLiteral.SpaceX4,
    newlineLiteral: NewlineLiteral.Unix,
    maybeCancellationToken: undefined,
};

export function compare(expected: string, actual: string, newlineLiteral: NewlineLiteral = NewlineLiteral.Unix): void {
    expected = expected.trim();
    const actualLines: ReadonlyArray<string> = actual.split(newlineLiteral);
    const expectedLines: ReadonlyArray<string> = expected.split(newlineLiteral);

    const minLength: number = Math.min(actualLines.length, expectedLines.length);
    for (let lineNumber: number = 0; lineNumber < minLength; lineNumber += 1) {
        const actualLine: string = actualLines[lineNumber];
        const expectedLine: string = expectedLines[lineNumber];

        if (expectedLine !== actualLine) {
            const details: {} = {
                lineNumber,
                expectedLine,
                actualLine,
            };
            expect(actualLine).to.equal(expectedLine, JSON.stringify(details, undefined, 4));
        }
    }

    const edgeExpectedLine: string = expectedLines[minLength];
    const edgeActualLine: string = actualLines[minLength];
    expect(edgeActualLine).to.equal(edgeExpectedLine, `line:${minLength + 1}`);
}

// Formats the text twice to ensure the formatter emits the same tokens.
export function expectFormat(text: string, formatSettings: FormatSettings = DefaultFormatSettings): string {
    text = text.trim();
    const firstTriedFormat: TriedFormat = tryFormat(formatSettings, text);
    if (PQP.ResultUtils.isErr(firstTriedFormat)) {
        throw firstTriedFormat.error;
    }
    const firstOk: string = firstTriedFormat.value;

    const secondTriedFormat: TriedFormat = tryFormat(formatSettings, firstOk);
    if (PQP.ResultUtils.isErr(secondTriedFormat)) {
        throw secondTriedFormat.error;
    }
    const secondOk: string = secondTriedFormat.value;

    compare(firstOk, secondOk);
    return firstOk;
}
