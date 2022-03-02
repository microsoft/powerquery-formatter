// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

export function visitIfExpression(state: SerializeParameterState, node: Ast.IfExpression): void {
    propagateWriteKind(state, node, node.ifConstant);

    const conditionIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.condition);

    let conditionWorkspace: SerializeParameter;
    let thenConstantWorkspace: SerializeParameter;

    if (conditionIsMultiline) {
        conditionWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializeWriteKind.Indented,
        };

        thenConstantWorkspace = {
            maybeWriteKind: SerializeWriteKind.Indented,
        };
    } else {
        conditionWorkspace = {
            maybeWriteKind: SerializeWriteKind.PaddedLeft,
        };

        thenConstantWorkspace = {
            maybeWriteKind: SerializeWriteKind.PaddedLeft,
        };
    }

    setWorkspace(state, node.condition, conditionWorkspace);
    setWorkspace(state, node.thenConstant, thenConstantWorkspace);

    setWorkspace(state, node.trueExpression, {
        maybeIndentationChange: 1,
        maybeWriteKind: SerializeWriteKind.Indented,
    });

    const falseExpression: Ast.TExpression = node.falseExpression;
    let falseExpressionWorkspace: SerializeParameter;

    if (falseExpression.kind === Ast.NodeKind.IfExpression) {
        falseExpressionWorkspace = {
            maybeWriteKind: SerializeWriteKind.PaddedLeft,
        };
    } else {
        falseExpressionWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializeWriteKind.Indented,
        };
    }

    setWorkspace(state, node.elseConstant, { maybeWriteKind: SerializeWriteKind.Indented });
    setWorkspace(state, falseExpression, falseExpressionWorkspace);
}
