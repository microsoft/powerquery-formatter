// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { SerializeParameter, SerializeParameterState, SerializerWriteKind } from "../types";
import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitFieldTypeSpecification(
    state: SerializeParameterState,
    node: PQP.Language.Ast.FieldTypeSpecification,
): void {
    // can't use propagateWriteKind as I want the equalConstant on the
    // same line as the previous node (FieldParameter).
    const workspace: SerializeParameter = getWorkspace(state, node);

    // assumes SerializerWriteKind.Indented -> maybeIndentationChange === 1
    if (workspace.maybeWriteKind === SerializerWriteKind.Indented) {
        setWorkspace(state, node.equalConstant, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
        setWorkspace(state, node.fieldType, {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializerWriteKind.Indented,
        });
    } else {
        propagateWriteKind(state, node, node.equalConstant);
        setWorkspace(state, node.fieldType, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
    }
}
