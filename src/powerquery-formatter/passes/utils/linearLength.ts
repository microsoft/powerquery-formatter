// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Trace, TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { LinearLengthMap, LinearLengthState } from "../commonTypes";
import { FormatTraceConstant } from "../../trace";

// Lazy evaluation of a potentially large AST.
// Returns the length of text if the node was formatted on a single line.
//
// Eg. the linear length of `{1, 2, 3}` as an Ast would give 9.
//
// Some nodes are always multiline, such as IfExpression, and will return NaN.
export async function getLinearLength(
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    linearLengthMap: LinearLengthMap,
    node: Ast.TNode,
    locale: string,
    traceManager: TraceManager,
    maybeCorrelationId: number | undefined,
    maybeCancellationToken: PQP.ICancellationToken | undefined,
): Promise<number> {
    const nodeId: number = node.id;
    const maybeLinearLength: number | undefined = linearLengthMap.get(nodeId);

    if (maybeLinearLength === undefined) {
        const linearLength: number = await calculateLinearLength(
            nodeIdMapCollection,
            linearLengthMap,
            node,
            locale,
            traceManager,
            maybeCorrelationId,
            maybeCancellationToken,
        );

        linearLengthMap.set(nodeId, linearLength);

        return linearLength;
    } else {
        return maybeLinearLength;
    }
}

async function calculateLinearLength(
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    linearLengthMap: LinearLengthMap,
    node: Ast.TNode,
    locale: string,
    traceManager: TraceManager,
    maybeCorrelationId: number | undefined,
    maybeCancellationToken: PQP.ICancellationToken | undefined,
): Promise<number> {
    const state: LinearLengthState = {
        locale,
        traceManager,
        maybeCancellationToken,
        maybeInitialCorrelationId: maybeCorrelationId,
        linearLengthMap,
        nodeIdMapCollection,
        result: 0,
    };

    const triedTraverse: PQP.Traverse.TriedTraverse<number> = await PQP.Traverse.tryTraverseAst(
        state,
        nodeIdMapCollection,
        node,
        PQP.Traverse.VisitNodeStrategy.DepthFirst,
        visitNode,
        PQP.Traverse.assertGetAllAstChildren,
        undefined,
    );

    if (PQP.ResultUtils.isError(triedTraverse)) {
        throw triedTraverse.error;
    } else {
        return triedTraverse.value;
    }
}

async function visitNode(
    state: LinearLengthState,
    node: Ast.TNode,
    maybeCorrelationId: number | undefined,
): Promise<void> {
    const trace: Trace = state.traceManager.entry(
        FormatTraceConstant.LinearLength,
        visitNode.name,
        maybeCorrelationId,
        {
            nodeId: node.id,
            nodeKind: node.kind,
        },
    );

    let linearLength: number;

    switch (node.kind) {
        // TPairedConstant
        case Ast.NodeKind.AsNullablePrimitiveType:
        case Ast.NodeKind.AsType:
        case Ast.NodeKind.CatchExpression:
        case Ast.NodeKind.EachExpression:
        case Ast.NodeKind.ErrorRaisingExpression:
        case Ast.NodeKind.IsNullablePrimitiveType:
        case Ast.NodeKind.NullablePrimitiveType:
        case Ast.NodeKind.NullableType:
        case Ast.NodeKind.OtherwiseExpression:
        case Ast.NodeKind.TypePrimaryType:
            linearLength = await sumLinearLengths(state, trace.id, 1, node.constant, node.paired);
            break;

        // TBinOpExpression
        case Ast.NodeKind.ArithmeticExpression:
        case Ast.NodeKind.AsExpression:
        case Ast.NodeKind.EqualityExpression:
        case Ast.NodeKind.IsExpression:
        case Ast.NodeKind.LogicalExpression:
        case Ast.NodeKind.NullCoalescingExpression:
        case Ast.NodeKind.RelationalExpression:
            linearLength = await visitBinOpExpressionNode(state, node, trace.id);
            break;

        // TKeyValuePair
        case Ast.NodeKind.GeneralizedIdentifierPairedAnyLiteral:
        case Ast.NodeKind.GeneralizedIdentifierPairedExpression:
        case Ast.NodeKind.IdentifierPairedExpression:
            linearLength = await sumLinearLengths(state, trace.id, 2, node.key, node.equalConstant, node.value);
            break;

        // TWrapped where Content is TCsv[] and no extra attributes
        case Ast.NodeKind.InvokeExpression:
        case Ast.NodeKind.ListExpression:
        case Ast.NodeKind.ListLiteral:
        case Ast.NodeKind.ParameterList:
        case Ast.NodeKind.RecordExpression:
        case Ast.NodeKind.RecordLiteral:
            linearLength = await visitWrappedCsvArray(state, node, trace.id);
            break;

        case Ast.NodeKind.ArrayWrapper:
            linearLength = await sumLinearLengths(state, trace.id, 0, ...node.elements);
            break;

        case Ast.NodeKind.Constant:
            linearLength = node.constantKind.length;
            break;

        case Ast.NodeKind.Csv:
            linearLength = await sumLinearLengths(state, trace.id, 0, node.node, node.maybeCommaConstant);
            break;

        case Ast.NodeKind.ErrorHandlingExpression: {
            let initialLength: number = 1;

            if (node.maybeHandler) {
                initialLength += 2;
            }

            linearLength = await sumLinearLengths(
                state,
                trace.id,
                initialLength,
                node.tryConstant,
                node.protectedExpression,
                node.maybeHandler,
            );

            break;
        }

        case Ast.NodeKind.FieldProjection:
            linearLength = await sumLinearLengths(
                state,
                trace.id,
                0,
                node.openWrapperConstant,
                node.closeWrapperConstant,
                node.maybeOptionalConstant,
                ...node.content.elements,
            );

            break;

        case Ast.NodeKind.FieldSelector:
            linearLength = await sumLinearLengths(
                state,
                trace.id,
                0,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
                node.maybeOptionalConstant,
            );

            break;

        case Ast.NodeKind.FieldSpecification:
            linearLength = await sumLinearLengths(
                state,
                trace.id,
                0,
                node.maybeOptionalConstant,
                node.name,
                node.maybeFieldTypeSpecification,
            );

            break;

        case Ast.NodeKind.FieldSpecificationList: {
            const elements: ReadonlyArray<Ast.ICsv<Ast.FieldSpecification>> = node.content.elements;

            let initialLength: number = 0;

            if (node.maybeOpenRecordMarkerConstant && elements.length) {
                initialLength += 2;
            }

            linearLength = await sumLinearLengths(
                state,
                trace.id,
                initialLength,
                node.openWrapperConstant,
                node.closeWrapperConstant,
                node.maybeOpenRecordMarkerConstant,
                ...elements,
            );

            break;
        }

        case Ast.NodeKind.FieldTypeSpecification:
            linearLength = await sumLinearLengths(state, trace.id, 2, node.equalConstant, node.fieldType);
            break;

        case Ast.NodeKind.FunctionExpression: {
            let initialLength: number = 2;

            if (node.maybeFunctionReturnType) {
                initialLength += 2;
            }

            linearLength = await sumLinearLengths(
                state,
                trace.id,
                initialLength,
                node.parameters,
                node.maybeFunctionReturnType,
                node.fatArrowConstant,
                node.expression,
            );

            break;
        }

        case Ast.NodeKind.FunctionType:
            linearLength = await sumLinearLengths(
                state,
                trace.id,
                2,
                node.functionConstant,
                node.parameters,
                node.functionReturnType,
            );

            break;

        case Ast.NodeKind.GeneralizedIdentifier:
        case Ast.NodeKind.Identifier:
            linearLength = node.literal.length;
            break;

        case Ast.NodeKind.IdentifierExpression:
            linearLength = await sumLinearLengths(state, trace.id, 0, node.maybeInclusiveConstant, node.identifier);
            break;

        case Ast.NodeKind.ItemAccessExpression:
            linearLength = await sumLinearLengths(
                state,
                trace.id,
                0,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
                node.maybeOptionalConstant,
            );

            break;

        case Ast.NodeKind.LiteralExpression:
            linearLength = node.literal.length;
            break;

        case Ast.NodeKind.ListType:
            linearLength = await sumLinearLengths(
                state,
                trace.id,
                0,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
            );

            break;

        case Ast.NodeKind.MetadataExpression: {
            linearLength = await sumLinearLengths(state, trace.id, 2, node.left, node.operatorConstant, node.right);
            break;
        }

        case Ast.NodeKind.NotImplementedExpression:
            linearLength = await sumLinearLengths(state, trace.id, 0, node.ellipsisConstant);
            break;

        case Ast.NodeKind.Parameter: {
            let initialLength: number = 0;

            if (node.maybeOptionalConstant) {
                initialLength += 1;
            }

            if (node.maybeParameterType) {
                initialLength += 1;
            }

            linearLength = await sumLinearLengths(
                state,
                trace.id,
                initialLength,
                node.maybeOptionalConstant,
                node.name,
                node.maybeParameterType,
            );

            break;
        }

        case Ast.NodeKind.ParenthesizedExpression:
            linearLength = await sumLinearLengths(
                state,
                trace.id,
                0,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
            );

            break;

        case Ast.NodeKind.PrimitiveType:
            linearLength = node.primitiveTypeKind.length;
            break;

        case Ast.NodeKind.RangeExpression:
            linearLength = await sumLinearLengths(state, trace.id, 0, node.left, node.rangeConstant, node.right);
            break;

        case Ast.NodeKind.RecordType:
            linearLength = await sumLinearLengths(state, trace.id, 0, node.fields);
            break;

        case Ast.NodeKind.RecursivePrimaryExpression:
            linearLength = await sumLinearLengths(state, trace.id, 0, node.head, ...node.recursiveExpressions.elements);
            break;

        case Ast.NodeKind.SectionMember: {
            let initialLength: number = 0;

            if (node.maybeLiteralAttributes) {
                initialLength += 1;
            }

            if (node.maybeSharedConstant) {
                initialLength += 1;
            }

            linearLength = await sumLinearLengths(
                state,
                trace.id,
                initialLength,
                node.maybeLiteralAttributes,
                node.maybeSharedConstant,
                node.namePairedExpression,
                node.semicolonConstant,
            );

            break;
        }

        case Ast.NodeKind.Section: {
            const sectionMembers: ReadonlyArray<Ast.SectionMember> = node.sectionMembers.elements;

            let initialLength: number = 0;

            if (node.maybeLiteralAttributes) {
                initialLength += 1;
            }

            if (node.maybeName) {
                initialLength += 1;
            }

            linearLength = await sumLinearLengths(
                state,
                trace.id,
                initialLength,
                node.maybeLiteralAttributes,
                node.sectionConstant,
                node.maybeName,
                node.semicolonConstant,
                ...sectionMembers,
            );

            break;
        }

        case Ast.NodeKind.TableType:
            linearLength = await sumLinearLengths(state, trace.id, 1, node.tableConstant, node.rowType);
            break;

        case Ast.NodeKind.UnaryExpression:
            linearLength = await sumLinearLengths(state, trace.id, 1, node.typeExpression, ...node.operators.elements);
            break;

        // is always multiline, therefore cannot have linear line length
        case Ast.NodeKind.IfExpression:
            linearLength = await sumLinearLengths(
                state,
                trace.id,
                1,
                node.ifConstant,
                node.condition,
                node.thenConstant,
                node.trueExpression,
                node.elseConstant,
                node.falseExpression,
            );

            break;
        case Ast.NodeKind.LetExpression:
            linearLength = await sumLinearLengths(
                state,
                trace.id,
                1,
                node.letConstant,
                node.variableList,
                node.inConstant,
                node.expression,
            );

            break;

        default:
            throw PQP.Assert.isNever(node);
    }

    state.linearLengthMap.set(node.id, linearLength);
    state.result = linearLength;

    trace.exit({ linearLength });
}

// eslint-disable-next-line require-await
async function visitBinOpExpressionNode(
    state: LinearLengthState,
    node: Ast.TBinOpExpression,
    maybeCorrelationId: number | undefined,
): Promise<number> {
    return sumLinearLengths(
        state,
        maybeCorrelationId,
        node.operatorConstant.constantKind.length,
        node.left,
        node.operatorConstant,
        node.right,
    );
}

function visitWrappedCsvArray(
    state: LinearLengthState,
    node:
        | Ast.InvokeExpression
        | Ast.ListExpression
        | Ast.ListLiteral
        | Ast.TParameterList
        | Ast.RecordExpression
        | Ast.RecordLiteral,
    maybeCorrelationId: number | undefined,
): Promise<number> {
    const elements: ReadonlyArray<Ast.TCsv> = node.content.elements;
    const numElements: number = elements.length;

    return sumLinearLengths(
        state,
        maybeCorrelationId,
        numElements ? numElements - 1 : 0,
        node.openWrapperConstant,
        node.closeWrapperConstant,
        ...elements,
    );
}

async function sumLinearLengths(
    state: LinearLengthState,
    maybeCorrelationId: number | undefined,
    initialLength: number,
    ...maybeNodes: (Ast.TNode | undefined)[]
): Promise<number> {
    const trace: Trace = state.traceManager.entry(
        FormatTraceConstant.LinearLength,
        sumLinearLengths.name,
        maybeCorrelationId,
    );

    const nodes: Ast.TNode[] = maybeNodes.filter(
        (value: Ast.TNode | undefined): value is Ast.TNode => value !== undefined,
    );

    const linearLengths: ReadonlyArray<number> = await PQP.ArrayUtils.mapAsync(nodes, (node: Ast.TNode) =>
        getLinearLength(
            state.nodeIdMapCollection,
            state.linearLengthMap,
            node,
            state.locale,
            state.traceManager,
            trace.id,
            state.maybeCancellationToken,
        ),
    );

    const result: number = linearLengths.reduce(
        (sum: number, linearLength: number) => sum + linearLength,
        initialLength,
    );

    trace.exit();

    return result;
}
