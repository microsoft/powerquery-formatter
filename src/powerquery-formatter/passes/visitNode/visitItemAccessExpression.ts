// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { IsMultilineMap, SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";
import { setWorkspace } from "./visitNodeUtils";
import { visitTWrapped } from "./visitTWrapped";

export function visitItemAccessExpression(
    state: SerializeParameterState,
    node: PQP.Language.Ast.ItemAccessExpression,
): void {
    const isMultilineMap: IsMultilineMap = state.isMultilineMap;
    const isMultiline: boolean = expectGetIsMultiline(isMultilineMap, node);
    const itemSelector: PQP.Language.Ast.TExpression = node.content;
    const itemSelectorIsMultiline: boolean = expectGetIsMultiline(isMultilineMap, itemSelector);
    visitTWrapped(state, node);

    if (isMultiline) {
        setWorkspace(state, itemSelector, {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializeWriteKind.Indented,
        });
    }

    let closeWrapperConstantWorkspace: SerializeParameter;
    if (itemSelectorIsMultiline) {
        switch (itemSelector.kind) {
            case PQP.Language.Ast.NodeKind.ListExpression:
            case PQP.Language.Ast.NodeKind.RecordExpression:
                closeWrapperConstantWorkspace = { maybeWriteKind: SerializeWriteKind.Any };
                break;

            default:
                closeWrapperConstantWorkspace = { maybeWriteKind: SerializeWriteKind.Indented };
        }
    } else {
        closeWrapperConstantWorkspace = {
            maybeWriteKind: SerializeWriteKind.Any,
        };
    }
    setWorkspace(state, node.closeWrapperConstant, closeWrapperConstantWorkspace);
}
