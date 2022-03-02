// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

// TPairedConstant override
export function visitErrorRaisingExpression(state: SerializeParameterState, node: Ast.ErrorRaisingExpression): void {
    propagateWriteKind(state, node, node.constant);

    let pairedWorkspace: SerializeParameter;

    switch (node.paired.kind) {
        case Ast.NodeKind.ListExpression:
        case Ast.NodeKind.RecordExpression:
            pairedWorkspace = {
                maybeWriteKind: SerializeWriteKind.PaddedLeft,
            };

            break;

        default: {
            const pairedIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.paired);

            if (pairedIsMultiline) {
                pairedWorkspace = {
                    maybeIndentationChange: 1,
                    maybeWriteKind: SerializeWriteKind.Indented,
                };
            } else {
                pairedWorkspace = { maybeWriteKind: SerializeWriteKind.PaddedLeft };
            }
        }
    }

    setWorkspace(state, node.paired, pairedWorkspace);
}
