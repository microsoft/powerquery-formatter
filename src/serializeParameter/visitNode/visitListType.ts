// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "./../isMultiline/common";
import { SerializeParameterState, SerializerWriteKind } from "./../types";
import { setWorkspace } from "./visitNodeUtils";
import { visitTWrapped } from "./visitTWrapped";

export function visitListType(state: SerializeParameterState, node: PQP.Language.Ast.ListType): void {
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);
    visitTWrapped(state, node);

    if (isMultiline) {
        setWorkspace(state, node.content, {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializerWriteKind.Indented,
        });
    }
}
