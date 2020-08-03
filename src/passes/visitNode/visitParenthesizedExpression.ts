// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { SerializeParameterState, SerializeWriteKind } from "../types";
import { setWorkspace } from "./visitNodeUtils";
import { visitTWrapped } from "./visitTWrapped";

export function visitParenthesizedExpression(
    state: SerializeParameterState,
    node: PQP.Language.Ast.ParenthesizedExpression,
): void {
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);
    visitTWrapped(state, node);

    if (isMultiline) {
        setWorkspace(state, node.content, {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializeWriteKind.Indented,
        });
    }
}
