// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { SerializeParameter, SerializeParameterState, SerializerWriteKind } from "../types";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitFunctionType(state: SerializeParameterState, node: PQP.Language.Ast.FunctionType): void {
    propagateWriteKind(state, node, node.functionConstant);

    const commonWorkspace: SerializeParameter = {
        maybeWriteKind: SerializerWriteKind.PaddedLeft,
    };
    setWorkspace(state, node.parameters, commonWorkspace);
    setWorkspace(state, node.functionReturnType, commonWorkspace);
}
