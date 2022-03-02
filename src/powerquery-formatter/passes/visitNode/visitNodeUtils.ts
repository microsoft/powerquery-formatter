// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import {
    DefaultSerializeParameter,
    IndentationChange,
    SerializeParameter,
    SerializeParameterState,
    SerializeWriteKind,
} from "../commonTypes";

export function getWorkspace(
    state: SerializeParameterState,
    node: Ast.TNode,
    fallback: SerializeParameter = DefaultSerializeParameter,
): SerializeParameter {
    return state.workspaceMap.get(node.id) ?? fallback;
}

export function setWorkspace(state: SerializeParameterState, node: Ast.TNode, workspace: SerializeParameter): void {
    state.workspaceMap.set(node.id, workspace);
}

// sets indentationChange for the parent using the parent's Workspace,
// then propagates the writeKind to firstChild by setting its Workspace.
export function propagateWriteKind(state: SerializeParameterState, parent: Ast.TNode, firstChild: Ast.TNode): void {
    const workspace: SerializeParameter = getWorkspace(state, parent);
    maybeSetIndentationChange(state, parent, workspace.maybeIndentationChange);

    const maybeWriteKind: SerializeWriteKind | undefined = workspace.maybeWriteKind;

    if (maybeWriteKind) {
        setWorkspace(state, firstChild, { maybeWriteKind });
    }
}

export function maybePropagateWriteKind(
    state: SerializeParameterState,
    parent: Ast.TNode,
    maybeFirstChild: Ast.TNode | undefined,
): boolean {
    if (maybeFirstChild) {
        const firstChild: Ast.TNode = maybeFirstChild;
        propagateWriteKind(state, parent, firstChild);

        return true;
    } else {
        return false;
    }
}

export function maybeSetIndentationChange(
    state: SerializeParameterState,
    node: Ast.TNode,
    maybeIndentationChange: IndentationChange | undefined,
): void {
    if (maybeIndentationChange) {
        state.result.indentationChange.set(node.id, maybeIndentationChange);
    }
}

export function skipPrimaryTypeIndentation(node: Ast.TPrimaryType): boolean {
    switch (node.kind) {
        case Ast.NodeKind.FunctionType:
        case Ast.NodeKind.NullableType:
        case Ast.NodeKind.TableType:
            return true;

        case Ast.NodeKind.ListType:
        case Ast.NodeKind.PrimitiveType:
        case Ast.NodeKind.RecordType:
            return false;

        default:
            throw PQP.Assert.isNever(node);
    }
}

// By default SectionMembers are two newlines apart from one another.
// Like-named sections (ex. Foo.Alpha, Foo.Bravo) should be placed one newline apart.
export function isSectionMemeberSimilarScope(left: Ast.SectionMember, right: Ast.SectionMember): boolean {
    const leftName: Ast.Identifier = left.namePairedExpression.key;
    const leftScope: ReadonlyArray<string> = leftName.literal.split(".");
    const rightName: Ast.Identifier = right.namePairedExpression.key;
    const rightScope: ReadonlyArray<string> = rightName.literal.split(".");

    return leftScope[0] === rightScope[0];
}
