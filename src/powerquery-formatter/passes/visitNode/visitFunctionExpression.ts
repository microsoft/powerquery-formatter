// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

export function visitFunctionExpression(
    state: SerializeParameterState,
    node: PQP.Language.Ast.FunctionExpression,
): void {
    propagateWriteKind(state, node, node.parameters);

    if (node.maybeFunctionReturnType) {
        const functionReturnType: PQP.Language.Ast.AsNullablePrimitiveType = node.maybeFunctionReturnType;
        setWorkspace(state, functionReturnType, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    }

    setWorkspace(state, node.fatArrowConstant, { maybeWriteKind: SerializeWriteKind.PaddedLeft });

    const expressionIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.expression);
    let expressionWorkspace: SerializeParameter;
    if (expressionIsMultiline) {
        expressionWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializeWriteKind.Indented,
        };
    } else {
        expressionWorkspace = { maybeWriteKind: SerializeWriteKind.PaddedLeft };
    }
    setWorkspace(state, node.expression, expressionWorkspace);
}
