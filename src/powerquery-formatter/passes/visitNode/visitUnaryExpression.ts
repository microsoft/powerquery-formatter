// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitUnaryExpression(state: SerializeParameterState, node: PQP.Language.Ast.UnaryExpression): void {
    propagateWriteKind(state, node, node.operators);

    const operators: ReadonlyArray<PQP.Language.Ast.IConstant<PQP.Language.Constant.UnaryOperatorKind>> =
        node.operators.elements;
    const lastOperator: PQP.Language.Ast.IConstant<PQP.Language.Constant.UnaryOperatorKind> =
        operators[operators.length - 1];
    if (lastOperator.constantKind === PQP.Language.Constant.UnaryOperatorKind.Not) {
        setWorkspace(state, node.typeExpression, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    }
}
