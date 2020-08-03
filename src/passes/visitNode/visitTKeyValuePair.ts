// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { IsMultilineMap, SerializeParameter, SerializeParameterState, SerializerWriteKind } from "../types";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitTKeyValuePair(state: SerializeParameterState, node: PQP.Language.Ast.TKeyValuePair): void {
    const isMultilineMap: IsMultilineMap = state.isMultilineMap;
    const equalConstantIsMultiline: boolean = expectGetIsMultiline(isMultilineMap, node.equalConstant);
    const valueIsMultiline: boolean = expectGetIsMultiline(isMultilineMap, node.value);
    propagateWriteKind(state, node, node.key);

    let equalWorkspace: SerializeParameter;
    if (equalConstantIsMultiline) {
        equalWorkspace = { maybeWriteKind: SerializerWriteKind.Indented };
    } else {
        equalWorkspace = { maybeWriteKind: SerializerWriteKind.PaddedLeft };
    }
    setWorkspace(state, node.equalConstant, equalWorkspace);

    let valueWorkspace: SerializeParameter;
    if (valueIsMultiline) {
        valueWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializerWriteKind.Indented,
        };
    } else {
        valueWorkspace = { maybeWriteKind: SerializerWriteKind.PaddedLeft };
    }
    setWorkspace(state, node.value, valueWorkspace);
}
