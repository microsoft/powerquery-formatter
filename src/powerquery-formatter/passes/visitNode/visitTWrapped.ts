// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

export function visitTWrapped(state: SerializeParameterState, node: PQP.Language.Ast.TWrapped): void {
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);
    // not const as it's conditionally overwritten if SerializeWriteKind.Indented
    let workspace: SerializeParameter = getWorkspace(state, node);

    if (workspace.maybeWriteKind === SerializeWriteKind.Indented) {
        const writeKind: SerializeWriteKind = wrapperOpenWriteKind(state, node);

        if (writeKind !== SerializeWriteKind.Indented) {
            workspace = {
                maybeIndentationChange: undefined,
                maybeWriteKind: writeKind,
            };
        }
    }

    setWorkspace(state, node, workspace);
    propagateWriteKind(state, node, node.openWrapperConstant);

    if (isMultiline) {
        setWorkspace(state, node.closeWrapperConstant, { maybeWriteKind: SerializeWriteKind.Indented });
    }
}

function wrapperOpenWriteKind(state: SerializeParameterState, node: PQP.Language.Ast.TWrapped): SerializeWriteKind {
    // an open constant is multiline iff it is has a multiline comment
    const openIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.openWrapperConstant);

    if (openIsMultiline) {
        return SerializeWriteKind.Indented;
    }

    if (
        node.kind === PQP.Language.Ast.NodeKind.InvokeExpression ||
        node.kind === PQP.Language.Ast.NodeKind.ItemAccessExpression
    ) {
        return SerializeWriteKind.Any;
    }

    const nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection = state.nodeIdMapCollection;

    let maybeParent: PQP.Language.Ast.TNode | undefined = PQP.Parser.NodeIdMapUtils.maybeParentAst(
        nodeIdMapCollection,
        node.id,
    );

    if (maybeParent && maybeParent.kind === PQP.Language.Ast.NodeKind.Csv) {
        maybeParent = PQP.Parser.NodeIdMapUtils.maybeParentAst(nodeIdMapCollection, maybeParent.id);
    }

    if (maybeParent && maybeParent.kind === PQP.Language.Ast.NodeKind.ArrayWrapper) {
        maybeParent = PQP.Parser.NodeIdMapUtils.maybeParentAst(nodeIdMapCollection, maybeParent.id);
    }

    if (!maybeParent) {
        return SerializeWriteKind.Indented;
    }

    switch (maybeParent.kind) {
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedAnyLiteral:
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedExpression:
        case PQP.Language.Ast.NodeKind.IdentifierPairedExpression:
        case PQP.Language.Ast.NodeKind.ListType:
        case PQP.Language.Ast.NodeKind.RecordType:
        case PQP.Language.Ast.NodeKind.TableType:
        case PQP.Language.Ast.NodeKind.TypePrimaryType:
            return SerializeWriteKind.PaddedLeft;

        case PQP.Language.Ast.NodeKind.ItemAccessExpression:
            return SerializeWriteKind.Any;

        default:
            return SerializeWriteKind.Indented;
    }
}
