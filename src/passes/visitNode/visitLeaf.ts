// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../types";
import { visitComments } from "./visitComments";
import { getWorkspace, maybeSetIndentationChange } from "./visitNodeUtils";

export function visitLeaf(
    state: SerializeParameterState,
    node:
        | PQP.Language.Ast.TConstant
        | PQP.Language.Ast.GeneralizedIdentifier
        | PQP.Language.Ast.Identifier
        | PQP.Language.Ast.LiteralExpression
        | PQP.Language.Ast.PrimitiveType,
): void {
    const workspace: SerializeParameter = getWorkspace(state, node);
    maybeSetIndentationChange(state, node, workspace.maybeIndentationChange);

    let maybeWriteKind: SerializeWriteKind | undefined = workspace.maybeWriteKind;
    maybeWriteKind = visitComments(state, node, maybeWriteKind);
    if (!maybeWriteKind) {
        const details: {} = {
            node,
            maybeWriteKind,
        };
        throw new PQP.CommonError.InvariantError("maybeWriteKind should be truthy", details);
    }

    state.result.writeKind.set(node.id, maybeWriteKind);
}
