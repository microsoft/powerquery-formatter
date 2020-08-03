// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../types";
import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitFieldTypeSpecification(
    state: SerializeParameterState,
    node: PQP.Language.Ast.FieldTypeSpecification,
): void {
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
