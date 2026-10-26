// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import "mocha";
import * as PQP from "@microsoft/powerquery-parser";
import { expect } from "chai";

import {
    CommentCollectionMap,
    SerializeParameterMap,
    tryTraverseSerializeParameter,
} from "../powerquery-formatter/passes";
import {
    DefaultSettings,
    IndentationLiteral,
    NewlineLiteral,
    SerializeSettings,
    TriedSerialize,
    tryFormat,
    trySerialize,
} from "..";
import { expectFormat } from "./common";
import { SyncThemeRegistry } from "../powerquery-formatter/themes";

class CountingRegExp extends RegExp {
    public matchCount: number = 0;
    public readonly inputs: string[] = [];

    public override [Symbol.match](text: string): RegExpMatchArray | null {
        this.matchCount += 1;
        this.inputs.push(text);

        return super[Symbol.match](text);
    }
}

describe("serialize dedent matching", () => {
    for (const maxWidth of [120, 40]) {
        it(`only matches at the start of a line (maxWidth ${maxWidth})`, async () => {
            const text: string = "if x then x else if x then x else x";

            const expected: string = await expectFormat(text, {
                ...DefaultSettings,
                maxWidth,
                newlineLiteral: NewlineLiteral.Unix,
            });

            const parsed: PQP.Task.TriedLexParseTask = await PQP.TaskUtils.tryLexParse(DefaultSettings, text);

            PQP.TaskUtils.assertIsParseStageOk(parsed);

            const commentCollectionMap: CommentCollectionMap = new Map();

            const parameters: PQP.Traverse.TriedTraverse<SerializeParameterMap> = await tryTraverseSerializeParameter(
                parsed.ast,
                parsed.nodeIdMapCollection,
                commentCollectionMap,
                SyncThemeRegistry.defaultInstance.scopeMetaProvider,
                DefaultSettings.locale,
                DefaultSettings.traceManager,
                undefined,
                undefined,
            );

            if (PQP.ResultUtils.isError(parameters)) {
                throw parameters.error;
            }

            const matcher: CountingRegExp = new CountingRegExp("^if x then[\\s\\S]*else[\\s]*$", "g");

            for (const [id, parameter] of parameters.value.parametersMap) {
                if (parameter.dedentContainerConditionReg) {
                    parameters.value.parametersMap.set(id, { ...parameter, dedentContainerConditionReg: matcher });
                }
            }

            const settings: SerializeSettings = {
                ...DefaultSettings,
                ast: parsed.ast,
                text,
                nodeIdMapCollection: parsed.nodeIdMapCollection,
                newlineLiteral: NewlineLiteral.Unix,
                maxWidth: maxWidth - 2,
                passthroughMaps: {
                    commentCollectionMap,
                    eofCommentCollection: { prefixedComments: [], prefixedCommentsContainsNewline: false },
                    containerIdHavingComments: new Set(),
                    serializeParameterMap: parameters.value,
                },
            };

            const actual: TriedSerialize = await trySerialize(settings);

            if (PQP.ResultUtils.isError(actual)) {
                throw actual.error;
            }

            expect(actual.value).to.equal(expected);
            expect(matcher.matchCount).to.equal(maxWidth === 120 ? 1 : 2);
            expect(matcher.inputs[0]).to.equal("");

            if (maxWidth === 40) {
                expect(matcher.inputs[1]).to.equal("if x then\n    x\nelse\n");
            }
        });
    }
});

describe("chunked serialization", () => {
    const fixtures: ReadonlyArray<{ name: string; text: string; lines: ReadonlyArray<string> }> = [
        {
            name: "empty wrappers and punctuation on pseudo-lines",
            text: "let f=()=>{},r=[],x=f() in [f=f,r=r,x=x]",
            lines: [
                "let",
                "    f = () =>",
                "        {},",
                "    r = [],",
                "    x = f()",
                "in",
                "    [",
                "        f = f,",
                "        r = r,",
                "        x = x",
                "    ]",
            ],
        },
        {
            name: "else-if joins across generated newlines",
            text: "if x then x else if x then x else x",
            lines: ["if x then", "    x", "else if x then", "    x", "else", "    x"],
        },
        {
            name: "EOF line-comment whitespace",
            text: "let x=1 in x // tail \t",
            lines: ["let", "    x = 1", "in", "    x", "// tail"],
        },
        {
            name: "embedded comment newlines and trailing source whitespace",
            text: "let x=1 in x /* tail \t\n comment */ \r\n\r\n",
            lines: ["let", "    x = 1", "in", "    x", "/* tail \t\n comment */"],
        },
        {
            name: "embedded literal newlines",
            text: 'let x="first\r\nsecond" in x',
            lines: ["let", '    x = "first\r\nsecond"', "in", "    x"],
        },
        {
            name: "blank lines between section members",
            text: "section S;\nshared A.x=1;\n\nshared A.y={};\n\n\nshared B.x=[];",
            lines: ["section S;", "", "shared A.x = 1;", "", "shared A.y = {};", "", "shared B.x = [];"],
        },
        {
            name: "literal whitespace is not output padding",
            text: '"a \t"',
            lines: ['"a \t"'],
        },
    ];

    for (const newlineLiteral of [NewlineLiteral.Unix, NewlineLiteral.Windows]) {
        for (const indentationLiteral of [IndentationLiteral.SpaceX4, IndentationLiteral.Tab]) {
            for (const fixture of fixtures) {
                it(`${fixture.name} (${JSON.stringify({ newlineLiteral, indentationLiteral })})`, async () => {
                    const actual: string = PQP.ResultUtils.assertOk(
                        await tryFormat(
                            { ...DefaultSettings, maxWidth: 40, newlineLiteral, indentationLiteral },
                            fixture.text,
                        ),
                    );

                    const expected: string =
                        fixture.lines
                            .map((line: string) =>
                                line.replace(/^ +/, (spaces: string) => indentationLiteral.repeat(spaces.length / 4)),
                            )
                            .join(newlineLiteral) + newlineLiteral;

                    expect(actual).to.equal(expected);
                });
            }
        }
    }
});
