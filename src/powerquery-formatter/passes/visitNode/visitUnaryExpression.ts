// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameterState, SerializeWriteKind } from "../commonTypes";

export function visitUnaryExpression(state: SerializeParameterState, node: Ast.UnaryExpression): void {
    propagateWriteKind(state, node, node.operators);

    const operators: ReadonlyArray<Ast.IConstant<PQP.Language.Constant.UnaryOperator>> = node.operators.elements;
    const lastOperator: Ast.IConstant<PQP.Language.Constant.UnaryOperator> = operators[operators.length - 1];

    if (lastOperator.constantKind === PQP.Language.Constant.UnaryOperator.Not) {
        setWorkspace(state, node.typeExpression, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    }
}
