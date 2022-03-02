// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

export function visitFunctionExpression(state: SerializeParameterState, node: Ast.FunctionExpression): void {
    propagateWriteKind(state, node, node.parameters);

    if (node.maybeFunctionReturnType) {
        const functionReturnType: Ast.AsNullablePrimitiveType = node.maybeFunctionReturnType;
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
