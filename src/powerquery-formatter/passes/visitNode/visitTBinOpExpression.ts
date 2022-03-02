// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

export function visitTBinOpExpression(state: SerializeParameterState, node: Ast.TBinOpExpression): void {
    propagateWriteKind(state, node, node.left);
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);

    if (isMultiline && node.kind !== Ast.NodeKind.LogicalExpression) {
        setWorkspace(state, node.operatorConstant, { maybeWriteKind: SerializeWriteKind.Indented });
        setWorkspace(state, node.right, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    } else {
        setWorkspace(state, node.operatorConstant, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
        setWorkspace(state, node.right, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    }
}
