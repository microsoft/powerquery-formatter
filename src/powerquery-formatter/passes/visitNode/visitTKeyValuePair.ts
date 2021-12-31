// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { IsMultilineMap, SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { expectGetIsMultiline } from "../isMultiline/common";

export function visitTKeyValuePair(state: SerializeParameterState, node: PQP.Language.Ast.TKeyValuePair): void {
    const isMultilineMap: IsMultilineMap = state.isMultilineMap;
    const equalConstantIsMultiline: boolean = expectGetIsMultiline(isMultilineMap, node.equalConstant);
    const valueIsMultiline: boolean = expectGetIsMultiline(isMultilineMap, node.value);
    propagateWriteKind(state, node, node.key);

    let equalWorkspace: SerializeParameter;
    if (equalConstantIsMultiline) {
        equalWorkspace = { maybeWriteKind: SerializeWriteKind.Indented };
    } else {
        equalWorkspace = { maybeWriteKind: SerializeWriteKind.PaddedLeft };
    }
    setWorkspace(state, node.equalConstant, equalWorkspace);

    let valueWorkspace: SerializeParameter;
    if (valueIsMultiline) {
        valueWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializeWriteKind.Indented,
        };
    } else {
        valueWorkspace = { maybeWriteKind: SerializeWriteKind.PaddedLeft };
    }
    setWorkspace(state, node.value, valueWorkspace);
}
