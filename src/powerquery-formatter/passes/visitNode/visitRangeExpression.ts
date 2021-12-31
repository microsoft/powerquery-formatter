// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";

export function visitRangeExpression(state: SerializeParameterState, node: PQP.Language.Ast.RangeExpression): void {
    const workspace: SerializeParameter = getWorkspace(state, node);
    propagateWriteKind(state, node, node.left);

    if (workspace.maybeWriteKind === SerializeWriteKind.Indented) {
        setWorkspace(state, node.rangeConstant, { maybeWriteKind: SerializeWriteKind.Indented });
        setWorkspace(state, node.right, { maybeWriteKind: SerializeWriteKind.Indented });
    }
}
