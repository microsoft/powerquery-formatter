// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { SerializeParameterState, SerializeWriteKind } from "../types";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitErrorHandlingExpression(
    state: SerializeParameterState,
    node: PQP.Language.Ast.ErrorHandlingExpression,
): void {
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

    if (node.maybeOtherwiseExpression) {
        const otherwiseExpression: PQP.Language.Ast.OtherwiseExpression = node.maybeOtherwiseExpression;

        let otherwiseWriteKind: SerializeWriteKind;
        if (isMultiline) {
            otherwiseWriteKind = SerializeWriteKind.Indented;
        } else {
            otherwiseWriteKind = SerializeWriteKind.PaddedLeft;
        }

        setWorkspace(state, otherwiseExpression, { maybeWriteKind: otherwiseWriteKind });
    }
}
