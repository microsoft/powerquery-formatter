// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { IsMultilineMap, SerializeParameter, SerializeParameterState, SerializerWriteKind } from "../types";
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
            maybeWriteKind: SerializerWriteKind.Indented,
        });
    }

    let closeWrapperConstantWorkspace: SerializeParameter;
    if (itemSelectorIsMultiline) {
        switch (itemSelector.kind) {
            case PQP.Language.Ast.NodeKind.ListExpression:
            case PQP.Language.Ast.NodeKind.RecordExpression:
                closeWrapperConstantWorkspace = { maybeWriteKind: SerializerWriteKind.Any };
                break;

            default:
                closeWrapperConstantWorkspace = { maybeWriteKind: SerializerWriteKind.Indented };
        }
    } else {
        closeWrapperConstantWorkspace = {
            maybeWriteKind: SerializerWriteKind.Any,
        };
    }
    setWorkspace(state, node.closeWrapperConstant, closeWrapperConstantWorkspace);
}
