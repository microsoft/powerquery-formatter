// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { SerializeParameterState, SerializerWriteKind } from "../types";
import { setWorkspace } from "./visitNodeUtils";

export function visitTParameter(state: SerializeParameterState, node: PQP.Language.Ast.TParameter): void {
    if (node.maybeOptionalConstant) {
        const optionalConstant: PQP.Language.Ast.IConstant<PQP.Language.Ast.IdentifierConstantKind.Optional> =
            node.maybeOptionalConstant;
        setWorkspace(state, optionalConstant, { maybeWriteKind: SerializerWriteKind.PaddedRight });
    }

    if (node.maybeParameterType) {
        const parameterType: PQP.Language.Ast.TParameterType = node.maybeParameterType;
        setWorkspace(state, parameterType, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
    }
}
