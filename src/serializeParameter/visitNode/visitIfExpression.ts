// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "./../isMultiline/common";
import { SerializeParameter, SerializeParameterState, SerializerWriteKind } from "./../types";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitIfExpression(state: SerializeParameterState, node: PQP.Language.Ast.IfExpression): void {
    propagateWriteKind(state, node, node.ifConstant);

    const conditionIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.condition);

    let conditionWorkspace: SerializeParameter;
    let thenConstantWorkspace: SerializeParameter;
    if (conditionIsMultiline) {
        conditionWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializerWriteKind.Indented,
        };
        thenConstantWorkspace = {
            maybeWriteKind: SerializerWriteKind.Indented,
        };
    } else {
        conditionWorkspace = {
            maybeWriteKind: SerializerWriteKind.PaddedLeft,
        };
        thenConstantWorkspace = {
            maybeWriteKind: SerializerWriteKind.PaddedLeft,
        };
    }
    setWorkspace(state, node.condition, conditionWorkspace);
    setWorkspace(state, node.thenConstant, thenConstantWorkspace);
    setWorkspace(state, node.trueExpression, {
        maybeIndentationChange: 1,
        maybeWriteKind: SerializerWriteKind.Indented,
    });

    const falseExpression: PQP.Language.Ast.TExpression = node.falseExpression;
    let falseExpressionWorkspace: SerializeParameter;
    if (falseExpression.kind === PQP.Language.Ast.NodeKind.IfExpression) {
        falseExpressionWorkspace = {
            maybeWriteKind: SerializerWriteKind.PaddedLeft,
        };
    } else {
        falseExpressionWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializerWriteKind.Indented,
        };
    }
    setWorkspace(state, node.elseConstant, { maybeWriteKind: SerializerWriteKind.Indented });
    setWorkspace(state, falseExpression, falseExpressionWorkspace);
}
