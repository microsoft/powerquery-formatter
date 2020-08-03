// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { SerializeParameter, SerializeParameterState, SerializerWriteKind } from "../types";
import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitRangeExpression(state: SerializeParameterState, node: PQP.Language.Ast.RangeExpression): void {
    const workspace: SerializeParameter = getWorkspace(state, node);
    propagateWriteKind(state, node, node.left);

    if (workspace.maybeWriteKind === SerializerWriteKind.Indented) {
        setWorkspace(state, node.rangeConstant, { maybeWriteKind: SerializerWriteKind.Indented });
        setWorkspace(state, node.right, { maybeWriteKind: SerializerWriteKind.Indented });
    }
}
