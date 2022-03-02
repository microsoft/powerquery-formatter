// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { maybePropagateWriteKind, propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

// TPairedConstant override
export function visitFieldSpecification(state: SerializeParameterState, node: Ast.FieldSpecification): void {
    const maybeOptionalConstant: Ast.IConstant<PQP.Language.Constant.LanguageConstant.Optional> | undefined =
        node.maybeOptionalConstant;

    if (maybePropagateWriteKind(state, node, maybeOptionalConstant)) {
        setWorkspace(state, node.name, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    } else {
        propagateWriteKind(state, node, node.name);
    }

    const maybeFieldTypeSpecification: Ast.FieldTypeSpecification | undefined = node.maybeFieldTypeSpecification;

    if (maybeFieldTypeSpecification) {
        const fieldTypeSpecification: Ast.FieldTypeSpecification = maybeFieldTypeSpecification;
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
