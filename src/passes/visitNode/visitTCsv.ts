// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../types";
import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitTCsv(state: SerializeParameterState, node: PQP.Language.Ast.TCsv): void {
    const workspace: SerializeParameter = getWorkspace(state, node);
    const maybeWriteKind: SerializeWriteKind | undefined = workspace.maybeWriteKind;
    propagateWriteKind(state, node, node.node);

    if (node.maybeCommaConstant && maybeWriteKind !== SerializeWriteKind.Indented) {
        const commaConstant: PQP.Language.Ast.IConstant<PQP.Language.Constant.MiscConstantKind.Comma> =
            node.maybeCommaConstant;
        setWorkspace(state, commaConstant, { maybeWriteKind: SerializeWriteKind.PaddedRight });
    }
}
