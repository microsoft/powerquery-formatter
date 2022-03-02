// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

export function visitTWrapped(state: SerializeParameterState, node: Ast.TWrapped): void {
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

function wrapperOpenWriteKind(state: SerializeParameterState, node: Ast.TWrapped): SerializeWriteKind {
    // an open constant is multiline iff it is has a multiline comment
    const openIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.openWrapperConstant);

    if (openIsMultiline) {
        return SerializeWriteKind.Indented;
    }

    if (node.kind === Ast.NodeKind.InvokeExpression || node.kind === Ast.NodeKind.ItemAccessExpression) {
        return SerializeWriteKind.Any;
    }

    const nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection = state.nodeIdMapCollection;

    let maybeParent: Ast.TNode | undefined = PQP.Parser.NodeIdMapUtils.maybeParentAst(nodeIdMapCollection, node.id);

    if (maybeParent && maybeParent.kind === Ast.NodeKind.Csv) {
        maybeParent = PQP.Parser.NodeIdMapUtils.maybeParentAst(nodeIdMapCollection, maybeParent.id);
    }

    if (maybeParent && maybeParent.kind === Ast.NodeKind.ArrayWrapper) {
        maybeParent = PQP.Parser.NodeIdMapUtils.maybeParentAst(nodeIdMapCollection, maybeParent.id);
    }

    if (!maybeParent) {
        return SerializeWriteKind.Indented;
    }

    switch (maybeParent.kind) {
        case Ast.NodeKind.GeneralizedIdentifierPairedAnyLiteral:
        case Ast.NodeKind.GeneralizedIdentifierPairedExpression:
        case Ast.NodeKind.IdentifierPairedExpression:
        case Ast.NodeKind.ListType:
        case Ast.NodeKind.RecordType:
        case Ast.NodeKind.TableType:
        case Ast.NodeKind.TypePrimaryType:
            return SerializeWriteKind.PaddedLeft;

        case Ast.NodeKind.ItemAccessExpression:
            return SerializeWriteKind.Any;

        default:
            return SerializeWriteKind.Indented;
    }
}
