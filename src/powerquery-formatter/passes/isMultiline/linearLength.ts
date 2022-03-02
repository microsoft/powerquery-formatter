// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { LinearLengthMap, LinearLengthState } from "../commonTypes";
import { FormatTraceConstant } from "../../trace";

// Lazy evaluation of a potentially large PQP.Language.AST.
// Returns the length of text if the node was formatted on a single line.
//
// Eg. the linear length of `{1, 2, 3}` as an Ast would give 9.
//
// Some nodes are always multiline, such as IfExpression, and will return NaN.
export async function getLinearLength(
    locale: string,
    traceManager: PQP.Trace.TraceManager,
    maybeCancellationToken: PQP.ICancellationToken | undefined,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    linearLengthMap: LinearLengthMap,
    node: Ast.TNode,
): Promise<number> {
    const nodeId: number = node.id;
    const maybeLinearLength: number | undefined = linearLengthMap.get(nodeId);

    if (maybeLinearLength === undefined) {
        const linearLength: number = await calculateLinearLength(
            locale,
            traceManager,
            maybeCancellationToken,
            node,
            nodeIdMapCollection,
            linearLengthMap,
        );

        linearLengthMap.set(nodeId, linearLength);

        return linearLength;
    } else {
        return maybeLinearLength;
    }
}

async function calculateLinearLength(
    locale: string,
    traceManager: PQP.Trace.TraceManager,
    maybeCancellationToken: PQP.ICancellationToken | undefined,
    node: Ast.TNode,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    linearLengthMap: LinearLengthMap,
): Promise<number> {
    const state: LinearLengthState = {
        locale,
        traceManager,
        maybeCancellationToken,
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

async function visitNode(state: LinearLengthState, node: Ast.TNode): Promise<void> {
    const trace: PQP.Trace.Trace = state.traceManager.entry(FormatTraceConstant.LinearLength, visitNode.name, {
        nodeId: node.id,
        nodeKind: node.kind,
    });

    let linearLength: number;

    switch (node.kind) {
        // TPairedConstant
        case PQP.Language.Ast.NodeKind.AsNullablePrimitiveType:
        case PQP.Language.Ast.NodeKind.AsType:
        case PQP.Language.Ast.NodeKind.EachExpression:
        case PQP.Language.Ast.NodeKind.ErrorRaisingExpression:
        case PQP.Language.Ast.NodeKind.IsNullablePrimitiveType:
        case PQP.Language.Ast.NodeKind.NullablePrimitiveType:
        case PQP.Language.Ast.NodeKind.NullableType:
        case PQP.Language.Ast.NodeKind.OtherwiseExpression:
        case PQP.Language.Ast.NodeKind.TypePrimaryType:
            linearLength = await sumLinearLengths(state, 1, node.constant, node.paired);
            break;

        // TBinOpExpression
        case PQP.Language.Ast.NodeKind.ArithmeticExpression:
        case PQP.Language.Ast.NodeKind.AsExpression:
        case PQP.Language.Ast.NodeKind.EqualityExpression:
        case PQP.Language.Ast.NodeKind.IsExpression:
        case PQP.Language.Ast.NodeKind.LogicalExpression:
        case PQP.Language.Ast.NodeKind.NullCoalescingExpression:
        case PQP.Language.Ast.NodeKind.RelationalExpression:
            linearLength = await visitBinOpExpressionNode(state, node);
            break;

        // TKeyValuePair
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedAnyLiteral:
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedExpression:
        case PQP.Language.Ast.NodeKind.IdentifierPairedExpression:
            linearLength = await sumLinearLengths(state, 2, node.key, node.equalConstant, node.value);
            break;

        // TWrapped where Content is TCsv[] and no extra attributes
        case PQP.Language.Ast.NodeKind.InvokeExpression:
        case PQP.Language.Ast.NodeKind.ListExpression:
        case PQP.Language.Ast.NodeKind.ListLiteral:
        case PQP.Language.Ast.NodeKind.ParameterList:
        case PQP.Language.Ast.NodeKind.RecordExpression:
        case PQP.Language.Ast.NodeKind.RecordLiteral:
            linearLength = await visitWrappedCsvArray(state, node);
            break;

        case PQP.Language.Ast.NodeKind.ArrayWrapper:
            linearLength = await sumLinearLengths(state, 0, ...node.elements);
            break;

        case PQP.Language.Ast.NodeKind.Constant:
            linearLength = node.constantKind.length;
            break;

        case PQP.Language.Ast.NodeKind.Csv:
            linearLength = await sumLinearLengths(state, 0, node.node, node.maybeCommaConstant);
            break;

        case PQP.Language.Ast.NodeKind.ErrorHandlingExpression: {
            let initialLength: number = 1;

            if (node.maybeOtherwiseExpression) {
                initialLength += 2;
            }

            linearLength = await sumLinearLengths(
                state,
                initialLength,
                node.tryConstant,
                node.protectedExpression,
                node.maybeOtherwiseExpression,
            );

            break;
        }

        case PQP.Language.Ast.NodeKind.FieldProjection:
            linearLength = await sumLinearLengths(
                state,
                0,
                node.openWrapperConstant,
                node.closeWrapperConstant,
                node.maybeOptionalConstant,
                ...node.content.elements,
            );

            break;

        case PQP.Language.Ast.NodeKind.FieldSelector:
            linearLength = await sumLinearLengths(
                state,
                0,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
                node.maybeOptionalConstant,
            );

            break;

        case PQP.Language.Ast.NodeKind.FieldSpecification:
            linearLength = await sumLinearLengths(
                state,
                0,
                node.maybeOptionalConstant,
                node.name,
                node.maybeFieldTypeSpecification,
            );

            break;

        case PQP.Language.Ast.NodeKind.FieldSpecificationList: {
            const elements: ReadonlyArray<PQP.Language.Ast.ICsv<PQP.Language.Ast.FieldSpecification>> =
                node.content.elements;

            let initialLength: number = 0;

            if (node.maybeOpenRecordMarkerConstant && elements.length) {
                initialLength += 2;
            }

            linearLength = await sumLinearLengths(
                state,
                initialLength,
                node.openWrapperConstant,
                node.closeWrapperConstant,
                node.maybeOpenRecordMarkerConstant,
                ...elements,
            );

            break;
        }

        case PQP.Language.Ast.NodeKind.FieldTypeSpecification:
            linearLength = await sumLinearLengths(state, 2, node.equalConstant, node.fieldType);
            break;

        case PQP.Language.Ast.NodeKind.FunctionExpression: {
            let initialLength: number = 2;

            if (node.maybeFunctionReturnType) {
                initialLength += 2;
            }

            linearLength = await sumLinearLengths(
                state,
                initialLength,
                node.parameters,
                node.maybeFunctionReturnType,
                node.fatArrowConstant,
                node.expression,
            );

            break;
        }

        case PQP.Language.Ast.NodeKind.FunctionType:
            linearLength = await sumLinearLengths(
                state,
                2,
                node.functionConstant,
                node.parameters,
                node.functionReturnType,
            );

            break;

        case PQP.Language.Ast.NodeKind.GeneralizedIdentifier:
        case PQP.Language.Ast.NodeKind.Identifier:
            linearLength = node.literal.length;
            break;

        case PQP.Language.Ast.NodeKind.IdentifierExpression:
            linearLength = await sumLinearLengths(state, 0, node.maybeInclusiveConstant, node.identifier);
            break;

        case PQP.Language.Ast.NodeKind.ItemAccessExpression:
            linearLength = await sumLinearLengths(
                state,
                0,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
                node.maybeOptionalConstant,
            );

            break;

        case PQP.Language.Ast.NodeKind.LiteralExpression:
            linearLength = node.literal.length;
            break;

        case PQP.Language.Ast.NodeKind.ListType:
            linearLength = await sumLinearLengths(
                state,
                0,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
            );

            break;

        case PQP.Language.Ast.NodeKind.MetadataExpression: {
            linearLength = await sumLinearLengths(state, 2, node.left, node.operatorConstant, node.right);
            break;
        }

        case PQP.Language.Ast.NodeKind.NotImplementedExpression:
            linearLength = await sumLinearLengths(state, 0, node.ellipsisConstant);
            break;

        case PQP.Language.Ast.NodeKind.Parameter: {
            let initialLength: number = 0;

            if (node.maybeOptionalConstant) {
                initialLength += 1;
            }

            if (node.maybeParameterType) {
                initialLength += 1;
            }

            linearLength = await sumLinearLengths(
                state,
                initialLength,
                node.maybeOptionalConstant,
                node.name,
                node.maybeParameterType,
            );

            break;
        }

        case PQP.Language.Ast.NodeKind.ParenthesizedExpression:
            linearLength = await sumLinearLengths(
                state,
                0,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
            );

            break;

        case PQP.Language.Ast.NodeKind.PrimitiveType:
            linearLength = node.primitiveTypeKind.length;
            break;

        case PQP.Language.Ast.NodeKind.RangeExpression:
            linearLength = await sumLinearLengths(state, 0, node.left, node.rangeConstant, node.right);
            break;

        case PQP.Language.Ast.NodeKind.RecordType:
            linearLength = await sumLinearLengths(state, 0, node.fields);
            break;

        case PQP.Language.Ast.NodeKind.RecursivePrimaryExpression:
            linearLength = await sumLinearLengths(state, 0, node.head, ...node.recursiveExpressions.elements);
            break;

        case PQP.Language.Ast.NodeKind.SectionMember: {
            let initialLength: number = 0;

            if (node.maybeLiteralAttributes) {
                initialLength += 1;
            }

            if (node.maybeSharedConstant) {
                initialLength += 1;
            }

            linearLength = await sumLinearLengths(
                state,
                initialLength,
                node.maybeLiteralAttributes,
                node.maybeSharedConstant,
                node.namePairedExpression,
                node.semicolonConstant,
            );

            break;
        }

        case PQP.Language.Ast.NodeKind.Section: {
            const sectionMembers: ReadonlyArray<PQP.Language.Ast.SectionMember> = node.sectionMembers.elements;

            if (sectionMembers.length) {
                linearLength = NaN;
            } else {
                let initialLength: number = 0;

                if (node.maybeLiteralAttributes) {
                    initialLength += 1;
                }

                if (node.maybeName) {
                    initialLength += 1;
                }

                linearLength = await sumLinearLengths(
                    state,
                    initialLength,
                    node.maybeLiteralAttributes,
                    node.sectionConstant,
                    node.maybeName,
                    node.semicolonConstant,
                    ...sectionMembers,
                );
            }

            break;
        }

        case PQP.Language.Ast.NodeKind.TableType:
            linearLength = await sumLinearLengths(state, 1, node.tableConstant, node.rowType);
            break;

        case PQP.Language.Ast.NodeKind.UnaryExpression:
            linearLength = await sumLinearLengths(state, 1, node.typeExpression, ...node.operators.elements);
            break;

        // is always multiline, therefore cannot have linear line length
        case PQP.Language.Ast.NodeKind.IfExpression:
        case PQP.Language.Ast.NodeKind.LetExpression:
            linearLength = NaN;
            break;

        default:
            throw PQP.Assert.isNever(node);
    }

    state.linearLengthMap.set(node.id, linearLength);
    state.result = linearLength;

    trace.exit({ linearLength });
}

// eslint-disable-next-line require-await
async function visitBinOpExpressionNode(state: LinearLengthState, node: Ast.TBinOpExpression): Promise<number> {
    return sumLinearLengths(
        state,
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
): Promise<number> {
    const elements: ReadonlyArray<PQP.Language.Ast.TCsv> = node.content.elements;
    const numElements: number = elements.length;

    return sumLinearLengths(
        state,
        numElements ? numElements - 1 : 0,
        node.openWrapperConstant,
        node.closeWrapperConstant,
        ...elements,
    );
}

async function sumLinearLengths(
    state: LinearLengthState,
    initialLength: number,
    ...maybeNodes: (Ast.TNode | undefined)[]
): Promise<number> {
    const nodes: Ast.TNode[] = maybeNodes.filter(
        (value: Ast.TNode | undefined): value is Ast.TNode => value !== undefined,
    );

    const linearLengths: ReadonlyArray<number> = await PQP.ArrayUtils.mapAsync(nodes, (node: Ast.TNode) =>
        getLinearLength(
            state.locale,
            state.traceManager,
            state.maybeCancellationToken,
            state.nodeIdMapCollection,
            state.linearLengthMap,
            node,
        ),
    );

    return linearLengths.reduce((sum: number, linearLength: number) => sum + linearLength, initialLength);
}
