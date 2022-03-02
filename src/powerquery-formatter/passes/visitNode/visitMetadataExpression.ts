// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

export function visitMetadataExpression(state: SerializeParameterState, node: Ast.MetadataExpression): void {
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);
    propagateWriteKind(state, node, node.left);

    let otherWorkspace: SerializeParameter;

    if (isMultiline) {
        otherWorkspace = {
            maybeWriteKind: SerializeWriteKind.Indented,
        };
    } else {
        otherWorkspace = {
            maybeWriteKind: SerializeWriteKind.PaddedLeft,
        };
    }

    setWorkspace(state, node.operatorConstant, otherWorkspace);
    setWorkspace(state, node.right, otherWorkspace);
}
