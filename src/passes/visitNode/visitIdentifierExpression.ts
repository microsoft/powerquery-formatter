// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { DefaultSerializeParameter, SerializeParameterState } from "../commonTypes";
import { maybePropagateWriteKind, propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitIdentifierExpression(
    state: SerializeParameterState,
    node: PQP.Language.Ast.IdentifierExpression,
): void {
    if (maybePropagateWriteKind(state, node, node.maybeInclusiveConstant)) {
        setWorkspace(state, node.identifier, DefaultSerializeParameter);
    } else {
        propagateWriteKind(state, node, node.identifier);
    }
}
