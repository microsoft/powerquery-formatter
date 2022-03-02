// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

export function visitTPairedConstant(state: SerializeParameterState, node: Ast.TPairedConstant): void {
    propagateWriteKind(state, node, node.constant);

    const isPairedMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.paired);

    if (isPairedMultiline) {
        setWorkspace(state, node.paired, {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializeWriteKind.Indented,
        });
    } else {
        setWorkspace(state, node.paired, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    }
}
