// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

// TPairedConstant override
export function visitErrorRaisingExpression(
    state: SerializeParameterState,
    node: PQP.Language.Ast.ErrorRaisingExpression,
): void {
    propagateWriteKind(state, node, node.constant);

    let pairedWorkspace: SerializeParameter;
    switch (node.paired.kind) {
        case PQP.Language.Ast.NodeKind.ListExpression:
        case PQP.Language.Ast.NodeKind.RecordExpression:
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
