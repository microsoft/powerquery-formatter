// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";
import { setWorkspace } from "./visitNodeUtils";
import { visitTWrapped } from "./visitTWrapped";

export function visitListType(state: SerializeParameterState, node: Ast.ListType): void {
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);
    visitTWrapped(state, node);

    if (isMultiline) {
        setWorkspace(state, node.content, {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializeWriteKind.Indented,
        });
    }
}
