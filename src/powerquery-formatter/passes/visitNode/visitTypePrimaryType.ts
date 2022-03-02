// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { propagateWriteKind, setWorkspace, skipPrimaryTypeIndentation } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

export function visitTypePrimaryType(state: SerializeParameterState, node: Ast.TypePrimaryType): void {
    propagateWriteKind(state, node, node.constant);

    const paired: Ast.TPrimaryType = node.paired;
    const pairedIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, paired);
    let pairedWorkspace: SerializeParameter;

    if (skipPrimaryTypeIndentation(paired)) {
        pairedWorkspace = {
            maybeWriteKind: SerializeWriteKind.PaddedLeft,
        };
    } else if (pairedIsMultiline) {
        pairedWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializeWriteKind.Indented,
        };
    } else {
        pairedWorkspace = { maybeWriteKind: SerializeWriteKind.PaddedLeft };
    }

    setWorkspace(state, paired, pairedWorkspace);
}
