// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitTBinOpExpression(state: SerializeParameterState, node: PQP.Language.Ast.TBinOpExpression): void {
    propagateWriteKind(state, node, node.left);
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);

    if (isMultiline && node.kind !== PQP.Language.Ast.NodeKind.LogicalExpression) {
        setWorkspace(state, node.operatorConstant, { maybeWriteKind: SerializeWriteKind.Indented });
        setWorkspace(state, node.right, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    } else {
        setWorkspace(state, node.operatorConstant, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
        setWorkspace(state, node.right, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    }
}
