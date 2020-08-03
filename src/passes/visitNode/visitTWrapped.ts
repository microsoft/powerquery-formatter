// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { SerializeParameter, SerializeParameterState, SerializerWriteKind } from "../types";
import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitTWrapped(state: SerializeParameterState, node: PQP.Language.Ast.TWrapped): void {
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);
    // not const as it's conditionally overwritten if SerializerWriteKind.Indented
    let workspace: SerializeParameter = getWorkspace(state, node);

    if (workspace.maybeWriteKind === SerializerWriteKind.Indented) {
        const writeKind: SerializerWriteKind = wrapperOpenWriteKind(state, node);

        if (writeKind !== SerializerWriteKind.Indented) {
            workspace = {
                maybeIndentationChange: undefined,
                maybeWriteKind: writeKind,
            };
        }
    }

    setWorkspace(state, node, workspace);
    propagateWriteKind(state, node, node.openWrapperConstant);

    if (isMultiline) {
        setWorkspace(state, node.closeWrapperConstant, { maybeWriteKind: SerializerWriteKind.Indented });
    }
}

function wrapperOpenWriteKind(state: SerializeParameterState, node: PQP.Language.Ast.TWrapped): SerializerWriteKind {
    // an open constant is multiline iff it is has a multiline comment
    const openIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.openWrapperConstant);
    if (openIsMultiline) {
        return SerializerWriteKind.Indented;
    }

    if (
        node.kind === PQP.Language.Ast.NodeKind.InvokeExpression ||
        node.kind === PQP.Language.Ast.NodeKind.ItemAccessExpression
    ) {
        return SerializerWriteKind.Any;
    }

    const nodeIdMapCollection: PQP.NodeIdMap.Collection = state.nodeIdMapCollection;
    let maybeParent: PQP.Language.Ast.TNode | undefined = PQP.NodeIdMapUtils.maybeParentAstNode(
        nodeIdMapCollection,
        node.id,
    );
    if (maybeParent && maybeParent.kind === PQP.Language.Ast.NodeKind.Csv) {
        maybeParent = PQP.NodeIdMapUtils.maybeParentAstNode(nodeIdMapCollection, maybeParent.id);
    }
    if (maybeParent && maybeParent.kind === PQP.Language.Ast.NodeKind.ArrayWrapper) {
        maybeParent = PQP.NodeIdMapUtils.maybeParentAstNode(nodeIdMapCollection, maybeParent.id);
    }

    if (!maybeParent) {
        return SerializerWriteKind.Indented;
    }

    switch (maybeParent.kind) {
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedAnyLiteral:
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedExpression:
        case PQP.Language.Ast.NodeKind.IdentifierPairedExpression:
        case PQP.Language.Ast.NodeKind.ListType:
        case PQP.Language.Ast.NodeKind.RecordType:
        case PQP.Language.Ast.NodeKind.TableType:
        case PQP.Language.Ast.NodeKind.TypePrimaryType:
            return SerializerWriteKind.PaddedLeft;

        case PQP.Language.Ast.NodeKind.ItemAccessExpression:
            return SerializerWriteKind.Any;

        default:
            return SerializerWriteKind.Indented;
    }
}
