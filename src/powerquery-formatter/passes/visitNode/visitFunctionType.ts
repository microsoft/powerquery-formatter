// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";

export function visitFunctionType(state: SerializeParameterState, node: Ast.FunctionType): void {
    propagateWriteKind(state, node, node.functionConstant);

    const commonWorkspace: SerializeParameter = {
        maybeWriteKind: SerializeWriteKind.PaddedLeft,
    };

    setWorkspace(state, node.parameters, commonWorkspace);
    setWorkspace(state, node.functionReturnType, commonWorkspace);
}
