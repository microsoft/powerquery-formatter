// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";

export function visitRangeExpression(state: SerializeParameterState, node: Ast.RangeExpression): void {
    const workspace: SerializeParameter = getWorkspace(state, node);
    propagateWriteKind(state, node, node.left);

    if (workspace.maybeWriteKind === SerializeWriteKind.Indented) {
        setWorkspace(state, node.rangeConstant, { maybeWriteKind: SerializeWriteKind.Indented });
        setWorkspace(state, node.right, { maybeWriteKind: SerializeWriteKind.Indented });
    }
}
