// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { SerializeParameter, SerializeParameterState, SerializerWriteKind } from "../types";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";

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
                maybeWriteKind: SerializerWriteKind.PaddedLeft,
            };
            break;

        default:
            const pairedIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.paired);
            if (pairedIsMultiline) {
                pairedWorkspace = {
                    maybeIndentationChange: 1,
                    maybeWriteKind: SerializerWriteKind.Indented,
                };
            } else {
                pairedWorkspace = { maybeWriteKind: SerializerWriteKind.PaddedLeft };
            }
    }
    setWorkspace(state, node.paired, pairedWorkspace);
}
