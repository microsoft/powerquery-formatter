// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";

export function visitFunctionType(state: SerializeParameterState, node: PQP.Language.Ast.FunctionType): void {
    propagateWriteKind(state, node, node.functionConstant);

    const commonWorkspace: SerializeParameter = {
        maybeWriteKind: SerializeWriteKind.PaddedLeft,
    };
    setWorkspace(state, node.parameters, commonWorkspace);
    setWorkspace(state, node.functionReturnType, commonWorkspace);
}
