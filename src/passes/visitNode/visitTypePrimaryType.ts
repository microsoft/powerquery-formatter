// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { SerializeParameter, SerializeParameterState, SerializerWriteKind } from "../types";
import { propagateWriteKind, setWorkspace, skipPrimaryTypeIndentation } from "./visitNodeUtils";

export function visitTypePrimaryType(state: SerializeParameterState, node: PQP.Language.Ast.TypePrimaryType): void {
    propagateWriteKind(state, node, node.constant);

    const paired: PQP.Language.Ast.TPrimaryType = node.paired;
    const pairedIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, paired);
    let pairedWorkspace: SerializeParameter;
    if (skipPrimaryTypeIndentation(paired)) {
        pairedWorkspace = {
            maybeWriteKind: SerializerWriteKind.PaddedLeft,
        };
    } else if (pairedIsMultiline) {
        pairedWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializerWriteKind.Indented,
        };
    } else {
        pairedWorkspace = { maybeWriteKind: SerializerWriteKind.PaddedLeft };
    }
    setWorkspace(state, paired, pairedWorkspace);
}
