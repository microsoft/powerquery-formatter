// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { SerializeParameter, SerializeParameterState, SerializerWriteKind } from "../types";
import { maybePropagateWriteKind, propagateWriteKind, setWorkspace } from "./visitNodeUtils";

// TPairedConstant override
export function visitFieldSpecification(
    state: SerializeParameterState,
    node: PQP.Language.Ast.FieldSpecification,
): void {
    const maybeOptionalConstant:
        | PQP.Language.Ast.IConstant<PQP.Language.Ast.IdentifierConstantKind.Optional>
        | undefined = node.maybeOptionalConstant;

    if (maybePropagateWriteKind(state, node, maybeOptionalConstant)) {
        setWorkspace(state, node.name, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
    } else {
        propagateWriteKind(state, node, node.name);
    }

    const maybeFieldTypeSpecification: PQP.Language.Ast.FieldTypeSpecification | undefined =
        node.maybeFieldTypeSpecification;
    if (maybeFieldTypeSpecification) {
        const fieldTypeSpecification: PQP.Language.Ast.FieldTypeSpecification = maybeFieldTypeSpecification;
        const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, fieldTypeSpecification);
        let typeWorkspace: SerializeParameter;

        if (isMultiline) {
            typeWorkspace = {
                maybeIndentationChange: 1,
                maybeWriteKind: SerializerWriteKind.Indented,
            };
        } else {
            typeWorkspace = { maybeWriteKind: SerializerWriteKind.PaddedLeft };
        }
        setWorkspace(state, fieldTypeSpecification, typeWorkspace);
    }
}
