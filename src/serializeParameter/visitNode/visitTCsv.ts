// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { SerializeParameter, SerializeParameterState, SerializerWriteKind } from "../types";
import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitTCsv(state: SerializeParameterState, node: PQP.Language.Ast.TCsv): void {
    const workspace: SerializeParameter = getWorkspace(state, node);
    const maybeWriteKind: SerializerWriteKind | undefined = workspace.maybeWriteKind;
    propagateWriteKind(state, node, node.node);

    if (node.maybeCommaConstant && maybeWriteKind !== SerializerWriteKind.Indented) {
        const commaConstant: PQP.Language.Ast.IConstant<PQP.Language.Ast.MiscConstantKind.Comma> =
            node.maybeCommaConstant;
        setWorkspace(state, commaConstant, { maybeWriteKind: SerializerWriteKind.PaddedRight });
    }
}
