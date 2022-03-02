// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameterState, SerializeWriteKind } from "../commonTypes";

export function visitLetExpression(state: SerializeParameterState, node: Ast.LetExpression): void {
    propagateWriteKind(state, node, node.letConstant);
    setWorkspace(state, node.inConstant, { maybeWriteKind: SerializeWriteKind.Indented });

    setWorkspace(state, node.expression, {
        maybeIndentationChange: 1,
        maybeWriteKind: SerializeWriteKind.Indented,
    });
}
