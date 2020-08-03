// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { IsMultilineMap, SerializeParameterState, SerializerWriteKind } from "../types";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitSectionMember(state: SerializeParameterState, node: PQP.Language.Ast.SectionMember): void {
    const isMultilineMap: IsMultilineMap = state.isMultilineMap;
    let maybeSharedConstantWriteKind: SerializerWriteKind | undefined;
    let isNameExpressionPairWorkspaceSet: boolean = false;

    if (node.maybeLiteralAttributes) {
        const literalAttributes: PQP.Language.Ast.RecordLiteral = node.maybeLiteralAttributes;
        propagateWriteKind(state, node, literalAttributes);

        if (expectGetIsMultiline(isMultilineMap, literalAttributes)) {
            maybeSharedConstantWriteKind = SerializerWriteKind.Indented;
        } else {
            maybeSharedConstantWriteKind = SerializerWriteKind.PaddedLeft;
        }
    } else if (node.maybeSharedConstant) {
        const sharedConstant: PQP.Language.Ast.IConstant<PQP.Language.Ast.KeywordConstantKind.Shared> =
            node.maybeSharedConstant;
        propagateWriteKind(state, node, sharedConstant);
    } else {
        propagateWriteKind(state, node, node.namePairedExpression);
        isNameExpressionPairWorkspaceSet = true;
    }

    if (node.maybeSharedConstant && maybeSharedConstantWriteKind) {
        const sharedConstant: PQP.Language.Ast.IConstant<PQP.Language.Ast.KeywordConstantKind.Shared> =
            node.maybeSharedConstant;
        setWorkspace(state, sharedConstant, { maybeWriteKind: maybeSharedConstantWriteKind });
    }

    if (!isNameExpressionPairWorkspaceSet) {
        let isNameExpressionPairIndented: boolean = false;
        if (node.maybeSharedConstant) {
            const sharedConstant: PQP.Language.Ast.IConstant<PQP.Language.Ast.KeywordConstantKind.Shared> =
                node.maybeSharedConstant;

            if (expectGetIsMultiline(isMultilineMap, sharedConstant)) {
                isNameExpressionPairIndented = true;
            }
        } else if (node.maybeLiteralAttributes) {
            const literalAttributes: PQP.Language.Ast.RecordLiteral = node.maybeLiteralAttributes;

            if (expectGetIsMultiline(isMultilineMap, literalAttributes)) {
                isNameExpressionPairIndented = true;
            }
        }

        let writeKind: SerializerWriteKind;
        if (isNameExpressionPairIndented) {
            writeKind = SerializerWriteKind.Indented;
        } else {
            writeKind = SerializerWriteKind.PaddedLeft;
        }
        setWorkspace(state, node.namePairedExpression, { maybeWriteKind: writeKind });
    }
}
