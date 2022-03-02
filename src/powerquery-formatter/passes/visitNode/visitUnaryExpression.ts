// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameterState, SerializeWriteKind } from "../commonTypes";

export function visitUnaryExpression(state: SerializeParameterState, node: PQP.Language.Ast.UnaryExpression): void {
    propagateWriteKind(state, node, node.operators);

    const operators: ReadonlyArray<PQP.Language.Ast.IConstant<PQP.Language.Constant.UnaryOperator>> =
        node.operators.elements;

    const lastOperator: PQP.Language.Ast.IConstant<PQP.Language.Constant.UnaryOperator> =
        operators[operators.length - 1];

    if (lastOperator.constantKind === PQP.Language.Constant.UnaryOperator.Not) {
        setWorkspace(state, node.typeExpression, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    }
}
