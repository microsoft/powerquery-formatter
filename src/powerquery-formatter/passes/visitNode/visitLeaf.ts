// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { getWorkspace, maybeSetIndentationChange } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { visitComments } from "./visitComments";

export function visitLeaf(
    state: SerializeParameterState,
    node: Ast.TConstant | Ast.GeneralizedIdentifier | Ast.Identifier | Ast.LiteralExpression | Ast.PrimitiveType,
): void {
    const workspace: SerializeParameter = getWorkspace(state, node);
    maybeSetIndentationChange(state, node, workspace.maybeIndentationChange);

    let maybeWriteKind: SerializeWriteKind | undefined = workspace.maybeWriteKind;
    maybeWriteKind = visitComments(state, node, maybeWriteKind);

    if (!maybeWriteKind) {
        throw new PQP.CommonError.InvariantError("maybeWriteKind should be truthy", {
            node,
            maybeWriteKind,
        });
    }

    state.result.writeKind.set(node.id, maybeWriteKind);
}
