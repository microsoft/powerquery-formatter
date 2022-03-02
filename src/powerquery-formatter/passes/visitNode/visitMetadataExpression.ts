// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

export function visitMetadataExpression(
    state: SerializeParameterState,
    node: PQP.Language.Ast.MetadataExpression,
): void {
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
