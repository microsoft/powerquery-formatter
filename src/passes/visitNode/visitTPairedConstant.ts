// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { SerializeParameterState, SerializerWriteKind } from "../types";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitTPairedConstant(state: SerializeParameterState, node: PQP.Language.Ast.TPairedConstant): void {
    propagateWriteKind(state, node, node.constant);

    const isPairedMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.paired);
    if (isPairedMultiline) {
        setWorkspace(state, node.paired, {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializerWriteKind.Indented,
        });
    } else {
        setWorkspace(state, node.paired, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
    }
}
