// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";

export function visitTCsv(state: SerializeParameterState, node: PQP.Language.Ast.TCsv): void {
    const workspace: SerializeParameter = getWorkspace(state, node);
    const maybeWriteKind: SerializeWriteKind | undefined = workspace.maybeWriteKind;
    propagateWriteKind(state, node, node.node);

    if (node.maybeCommaConstant && maybeWriteKind !== SerializeWriteKind.Indented) {
        const commaConstant: PQP.Language.Ast.IConstant<PQP.Language.Constant.MiscConstant.Comma> =
            node.maybeCommaConstant;

        setWorkspace(state, commaConstant, { maybeWriteKind: SerializeWriteKind.PaddedRight });
    }
}
