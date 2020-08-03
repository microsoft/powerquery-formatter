// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import {
    DefaultSerializeParameter,
    IndentationChange,
    SerializeParameter,
    SerializeParameterState,
    SerializeWriteKind,
} from "../types";

export function getWorkspace(
    state: SerializeParameterState,
    node: PQP.Language.Ast.TNode,
    fallback: SerializeParameter = DefaultSerializeParameter,
): SerializeParameter {
    const maybeWorkspace: SerializeParameter | undefined = state.workspaceMap.get(node.id);

    if (maybeWorkspace !== undefined) {
        return maybeWorkspace;
    } else {
        return fallback;
    }
}

export function setWorkspace(
    state: SerializeParameterState,
    node: PQP.Language.Ast.TNode,
    workspace: SerializeParameter,
): void {
    state.workspaceMap.set(node.id, workspace);
}

// sets indentationChange for the parent using the parent's Workspace,
// then propagates the writeKind to firstChild by setting its Workspace.
export function propagateWriteKind(
    state: SerializeParameterState,
    parent: PQP.Language.Ast.TNode,
    firstChild: PQP.Language.Ast.TNode,
): void {
    const workspace: SerializeParameter = getWorkspace(state, parent);
    maybeSetIndentationChange(state, parent, workspace.maybeIndentationChange);

    const maybeWriteKind: SerializeWriteKind | undefined = workspace.maybeWriteKind;
    if (maybeWriteKind) {
        setWorkspace(state, firstChild, { maybeWriteKind });
    }
}

export function maybePropagateWriteKind(
    state: SerializeParameterState,
    parent: PQP.Language.Ast.TNode,
    maybeFirstChild: PQP.Language.Ast.TNode | undefined,
): boolean {
    if (maybeFirstChild) {
        const firstChild: PQP.Language.Ast.TNode = maybeFirstChild;
        propagateWriteKind(state, parent, firstChild);
        return true;
    } else {
        return false;
    }
}

export function maybeSetIndentationChange(
    state: SerializeParameterState,
    node: PQP.Language.Ast.TNode,
    maybeIndentationChange: IndentationChange | undefined,
): void {
    if (maybeIndentationChange) {
        state.result.indentationChange.set(node.id, maybeIndentationChange);
    }
}

export function skipPrimaryTypeIndentation(node: PQP.Language.Ast.TPrimaryType): boolean {
    switch (node.kind) {
        case PQP.Language.Ast.NodeKind.FunctionType:
        case PQP.Language.Ast.NodeKind.NullableType:
        case PQP.Language.Ast.NodeKind.TableType:
            return true;

        case PQP.Language.Ast.NodeKind.ListType:
        case PQP.Language.Ast.NodeKind.PrimitiveType:
        case PQP.Language.Ast.NodeKind.RecordType:
            return false;

        default:
            throw PQP.isNever(node);
    }
}

// By default SectionMembers are two newlines apart from one another.
// Like-named sections (ex. Foo.Alpha, Foo.Bravo) should be placed one newline apart.
export function isSectionMemeberSimilarScope(
    left: PQP.Language.Ast.SectionMember,
    right: PQP.Language.Ast.SectionMember,
): boolean {
    const leftName: PQP.Language.Ast.Identifier = left.namePairedExpression.key;
    const leftScope: ReadonlyArray<string> = leftName.literal.split(".");
    const rightName: PQP.Language.Ast.Identifier = right.namePairedExpression.key;
    const rightScope: ReadonlyArray<string> = rightName.literal.split(".");

    return leftScope[0] === rightScope[0];
}
