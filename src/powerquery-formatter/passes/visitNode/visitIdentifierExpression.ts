// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { DefaultSerializeParameter, SerializeParameterState } from "../commonTypes";
import { maybePropagateWriteKind, propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitIdentifierExpression(state: SerializeParameterState, node: Ast.IdentifierExpression): void {
    if (maybePropagateWriteKind(state, node, node.maybeInclusiveConstant)) {
        setWorkspace(state, node.identifier, DefaultSerializeParameter);
    } else {
        propagateWriteKind(state, node, node.identifier);
    }
}
