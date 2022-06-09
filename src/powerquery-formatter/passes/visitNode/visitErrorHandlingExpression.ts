// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

export function visitErrorHandlingExpression(state: SerializeParameterState, node: Ast.TErrorHandlingExpression): void {
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);
    propagateWriteKind(state, node, node.tryConstant);

    const protectedIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.protectedExpression);

    if (protectedIsMultiline) {
        setWorkspace(state, node.protectedExpression, {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializeWriteKind.Indented,
        });
    } else {
        setWorkspace(state, node.protectedExpression, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    }

    if (node.maybeHandler) {
        const handler: Ast.CatchExpression | Ast.OtherwiseExpression = node.maybeHandler;

        let otherwiseWriteKind: SerializeWriteKind;

        if (isMultiline) {
            otherwiseWriteKind = SerializeWriteKind.Indented;
        } else {
            otherwiseWriteKind = SerializeWriteKind.PaddedLeft;
        }

        setWorkspace(state, handler, { maybeWriteKind: otherwiseWriteKind });
    }
}
