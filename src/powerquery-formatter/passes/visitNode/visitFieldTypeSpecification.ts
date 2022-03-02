// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";

export function visitFieldTypeSpecification(state: SerializeParameterState, node: Ast.FieldTypeSpecification): void {
    // can't use propagateWriteKind as I want the equalConstant on the
    // same line as the previous node (FieldParameter).
    const workspace: SerializeParameter = getWorkspace(state, node);

    // assumes SerializeWriteKind.Indented -> maybeIndentationChange === 1
    if (workspace.maybeWriteKind === SerializeWriteKind.Indented) {
        setWorkspace(state, node.equalConstant, { maybeWriteKind: SerializeWriteKind.PaddedLeft });

        setWorkspace(state, node.fieldType, {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializeWriteKind.Indented,
        });
    } else {
        propagateWriteKind(state, node, node.equalConstant);
        setWorkspace(state, node.fieldType, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    }
}
