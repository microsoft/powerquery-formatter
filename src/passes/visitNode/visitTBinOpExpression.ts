// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { SerializeParameterState, SerializerWriteKind } from "../types";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitTBinOpExpression(state: SerializeParameterState, node: PQP.Language.Ast.TBinOpExpression): void {
    propagateWriteKind(state, node, node.left);
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);

    if (isMultiline) {
        setWorkspace(state, node.operatorConstant, { maybeWriteKind: SerializerWriteKind.Indented });
        setWorkspace(state, node.right, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
    } else if (node.kind === PQP.Language.Ast.NodeKind.LogicalExpression && isMultiline) {
        setWorkspace(state, node.operatorConstant, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
        setWorkspace(state, node.right, { maybeWriteKind: SerializerWriteKind.Indented });
    } else {
        setWorkspace(state, node.operatorConstant, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
        setWorkspace(state, node.right, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
    }
}
