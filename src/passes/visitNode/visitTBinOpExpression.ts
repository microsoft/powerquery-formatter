// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { SerializeParameterState, SerializeWriteKind } from "../types";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitTBinOpExpression(state: SerializeParameterState, node: PQP.Language.Ast.TBinOpExpression): void {
    propagateWriteKind(state, node, node.left);
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);

    if (isMultiline) {
        setWorkspace(state, node.operatorConstant, { maybeWriteKind: SerializeWriteKind.Indented });
        setWorkspace(state, node.right, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    } else if (node.kind === PQP.Language.Ast.NodeKind.LogicalExpression && isMultiline) {
        setWorkspace(state, node.operatorConstant, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
        setWorkspace(state, node.right, { maybeWriteKind: SerializeWriteKind.Indented });
    } else {
        setWorkspace(state, node.operatorConstant, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
        setWorkspace(state, node.right, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    }
}
