// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { maybePropagateWriteKind, propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

// TPairedConstant override
export function visitFieldSpecification(
    state: SerializeParameterState,
    node: PQP.Language.Ast.FieldSpecification,
): void {
    const maybeOptionalConstant:
        | PQP.Language.Ast.IConstant<PQP.Language.Constant.LanguageConstant.Optional>
        | undefined = node.maybeOptionalConstant;

    if (maybePropagateWriteKind(state, node, maybeOptionalConstant)) {
        setWorkspace(state, node.name, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
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
                maybeWriteKind: SerializeWriteKind.Indented,
            };
        } else {
            typeWorkspace = { maybeWriteKind: SerializeWriteKind.PaddedLeft };
        }

        setWorkspace(state, fieldTypeSpecification, typeWorkspace);
    }
}
