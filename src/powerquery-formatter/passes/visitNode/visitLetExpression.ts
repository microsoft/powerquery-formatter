// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameterState, SerializeWriteKind } from "../commonTypes";

export function visitLetExpression(state: SerializeParameterState, node: PQP.Language.Ast.LetExpression): void {
    propagateWriteKind(state, node, node.letConstant);
    setWorkspace(state, node.inConstant, { maybeWriteKind: SerializeWriteKind.Indented });
    setWorkspace(state, node.expression, {
        maybeIndentationChange: 1,
        maybeWriteKind: SerializeWriteKind.Indented,
    });
}
