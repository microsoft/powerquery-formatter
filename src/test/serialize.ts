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
import { DefaultSettings, NewlineLiteral, SerializeSettings, TriedSerialize, trySerialize } from "..";
import { expectFormat } from "./common";
import { SyncThemeRegistry } from "../powerquery-formatter/themes";

class CountingRegExp extends RegExp {
    public matchCount: number = 0;

    public override [Symbol.match](text: string): RegExpMatchArray | null {
        this.matchCount += 1;

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

            const matcher: CountingRegExp = new CountingRegExp("(else)[\\s]*$", "g");

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
        });
    }
});
