// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "./../isMultiline/common";
import { SerializeParameter, SerializeParameterState, SerializerWriteKind } from "./../types";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitFunctionExpression(
    state: SerializeParameterState,
    node: PQP.Language.Ast.FunctionExpression,
): void {
    propagateWriteKind(state, node, node.parameters);

    if (node.maybeFunctionReturnType) {
        const functionReturnType: PQP.Language.Ast.AsNullablePrimitiveType = node.maybeFunctionReturnType;
        setWorkspace(state, functionReturnType, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
    }

    setWorkspace(state, node.fatArrowConstant, { maybeWriteKind: SerializerWriteKind.PaddedLeft });

    const expressionIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.expression);
    let expressionWorkspace: SerializeParameter;
    if (expressionIsMultiline) {
        expressionWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializerWriteKind.Indented,
        };
    } else {
        expressionWorkspace = { maybeWriteKind: SerializerWriteKind.PaddedLeft };
    }
    setWorkspace(state, node.expression, expressionWorkspace);
}
