// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

export type LinearLengthMap = Map<number, number>;

// Lazy evaluation of a potentially large PQP.Language.AST.
// Returns the text length of the node if IsMultiline is set to false.
// Nodes which can't ever have a linear length (such as IfExpressions) will evaluate to NaN.
export function getLinearLength(
    localizationTemplates: PQP.ILocalizationTemplates,
    nodeIdMapCollection: PQP.NodeIdMap.Collection,
    linearLengthMap: LinearLengthMap,
    node: PQP.Language.Ast.TNode,
): number {
    const nodeId: number = node.id;
    const maybeLinearLength: number | undefined = linearLengthMap.get(nodeId);

    if (maybeLinearLength === undefined) {
        const linearLength: number = calculateLinearLength(
            localizationTemplates,
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

interface State extends PQP.Traverse.IState<number> {
    readonly nodeIdMapCollection: PQP.NodeIdMap.Collection;
    readonly linearLengthMap: LinearLengthMap;
}

function calculateLinearLength(
    localizationTemplates: PQP.ILocalizationTemplates,
    node: PQP.Language.Ast.TNode,
    nodeIdMapCollection: PQP.NodeIdMap.Collection,
    linearLengthMap: LinearLengthMap,
): number {
    const state: State = {
        localizationTemplates,
        result: 0,
        nodeIdMapCollection,
        linearLengthMap,
    };

    const triedTraverse: PQP.Traverse.TriedTraverse<number> = PQP.Traverse.tryTraverseAst(
        state,
        nodeIdMapCollection,
        node,
        PQP.Traverse.VisitNodeStrategy.DepthFirst,
        visitNode,
        PQP.Traverse.expectExpandAllAstChildren,
        undefined,
    );

    if (PQP.ResultUtils.isErr(triedTraverse)) {
        throw triedTraverse.error;
    } else {
        return triedTraverse.value;
    }
}

function visitNode(state: State, node: PQP.Language.Ast.TNode): void {
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
            linearLength = sumLinearLengths(state, 1, node.constant, node.paired);
            break;

        // TBinOpExpression
        case PQP.Language.Ast.NodeKind.AsExpression:
        case PQP.Language.Ast.NodeKind.ArithmeticExpression:
        case PQP.Language.Ast.NodeKind.EqualityExpression:
        case PQP.Language.Ast.NodeKind.IsExpression:
        case PQP.Language.Ast.NodeKind.LogicalExpression:
        case PQP.Language.Ast.NodeKind.RelationalExpression: {
            linearLength = sumLinearLengths(state, 2, node.left, node.operatorConstant, node.right);
            break;
        }

        // TKeyValuePair
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedAnyLiteral:
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedExpression:
        case PQP.Language.Ast.NodeKind.IdentifierPairedExpression:
            linearLength = sumLinearLengths(state, 2, node.key, node.equalConstant, node.value);
            break;

        // TWrapped where Content is TCsv[] and no extra attributes
        case PQP.Language.Ast.NodeKind.InvokeExpression:
        case PQP.Language.Ast.NodeKind.ListExpression:
        case PQP.Language.Ast.NodeKind.ListLiteral:
        case PQP.Language.Ast.NodeKind.ParameterList:
        case PQP.Language.Ast.NodeKind.RecordExpression:
        case PQP.Language.Ast.NodeKind.RecordLiteral: {
            const elements: ReadonlyArray<PQP.Language.Ast.TCsv> = node.content.elements;
            const numElements: number = elements.length;
            linearLength = sumLinearLengths(
                state,
                numElements ? numElements - 1 : 0,
                node.openWrapperConstant,
                node.closeWrapperConstant,
                ...elements,
            );
            break;
        }

        case PQP.Language.Ast.NodeKind.ArrayWrapper:
            linearLength = sumLinearLengths(state, 0, ...node.elements);
            break;

        case PQP.Language.Ast.NodeKind.Constant:
            linearLength = node.constantKind.length;
            break;

        case PQP.Language.Ast.NodeKind.Csv:
            linearLength = sumLinearLengths(state, 0, node.node, node.maybeCommaConstant);
            break;

        case PQP.Language.Ast.NodeKind.ErrorHandlingExpression: {
            let initialLength: number = 1;
            if (node.maybeOtherwiseExpression) {
                initialLength += 2;
            }
            linearLength = sumLinearLengths(
                state,
                initialLength,
                node.tryConstant,
                node.protectedExpression,
                node.maybeOtherwiseExpression,
            );
            break;
        }

        case PQP.Language.Ast.NodeKind.FieldProjection:
            linearLength = sumLinearLengths(
                state,
                0,
                node.openWrapperConstant,
                node.closeWrapperConstant,
                node.maybeOptionalConstant,
                ...node.content.elements,
            );
            break;

        case PQP.Language.Ast.NodeKind.FieldSelector:
            linearLength = sumLinearLengths(
                state,
                0,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
                node.maybeOptionalConstant,
            );
            break;

        case PQP.Language.Ast.NodeKind.FieldSpecification:
            linearLength = sumLinearLengths(
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
            linearLength = sumLinearLengths(
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
            linearLength = sumLinearLengths(state, 2, node.equalConstant, node.fieldType);
            break;

        case PQP.Language.Ast.NodeKind.FunctionExpression: {
            let initialLength: number = 2;
            if (node.maybeFunctionReturnType) {
                initialLength += 2;
            }
            linearLength = sumLinearLengths(
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
            linearLength = sumLinearLengths(state, 2, node.functionConstant, node.parameters, node.functionReturnType);
            break;

        case PQP.Language.Ast.NodeKind.GeneralizedIdentifier:
        case PQP.Language.Ast.NodeKind.Identifier:
            linearLength = node.literal.length;
            break;

        case PQP.Language.Ast.NodeKind.IdentifierExpression:
            linearLength = sumLinearLengths(state, 0, node.maybeInclusiveConstant, node.identifier);
            break;

        case PQP.Language.Ast.NodeKind.ItemAccessExpression:
            linearLength = sumLinearLengths(
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
            linearLength = sumLinearLengths(
                state,
                0,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
            );
            break;

        case PQP.Language.Ast.NodeKind.MetadataExpression: {
            linearLength = sumLinearLengths(state, 2, node.left, node.operatorConstant, node.right);
            break;
        }

        case PQP.Language.Ast.NodeKind.NotImplementedExpression:
            linearLength = sumLinearLengths(state, 0, node.ellipsisConstant);
            break;

        case PQP.Language.Ast.NodeKind.Parameter: {
            let initialLength: number = 0;
            if (node.maybeOptionalConstant) {
                initialLength += 1;
            }
            if (node.maybeParameterType) {
                initialLength += 1;
            }
            linearLength = sumLinearLengths(
                state,
                initialLength,
                node.maybeOptionalConstant,
                node.name,
                node.maybeParameterType,
            );
            break;
        }

        case PQP.Language.Ast.NodeKind.ParenthesizedExpression:
            linearLength = sumLinearLengths(
                state,
                0,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
            );
            break;

        case PQP.Language.Ast.NodeKind.PrimitiveType:
            linearLength = getLinearLength(
                state.localizationTemplates,
                state.nodeIdMapCollection,
                state.linearLengthMap,
                node.primitiveType,
            );
            break;

        case PQP.Language.Ast.NodeKind.RangeExpression:
            linearLength = sumLinearLengths(state, 0, node.left, node.rangeConstant, node.right);
            break;

        case PQP.Language.Ast.NodeKind.RecordType:
            linearLength = sumLinearLengths(state, 0, node.fields);
            break;

        case PQP.Language.Ast.NodeKind.RecursivePrimaryExpression:
            linearLength = sumLinearLengths(state, 0, node.head, ...node.recursiveExpressions.elements);
            break;

        case PQP.Language.Ast.NodeKind.SectionMember: {
            let initialLength: number = 0;
            if (node.maybeLiteralAttributes) {
                initialLength += 1;
            }
            if (node.maybeSharedConstant) {
                initialLength += 1;
            }

            linearLength = sumLinearLengths(
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

                linearLength = sumLinearLengths(
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
            linearLength = sumLinearLengths(state, 1, node.tableConstant, node.rowType);
            break;

        case PQP.Language.Ast.NodeKind.UnaryExpression:
            linearLength = sumLinearLengths(state, 1, node.typeExpression, ...node.operators.elements);
            break;

        // is always multiline, therefore cannot have linear line length
        case PQP.Language.Ast.NodeKind.IfExpression:
        case PQP.Language.Ast.NodeKind.LetExpression:
            linearLength = NaN;
            break;

        default:
            throw PQP.isNever(node);
    }

    state.linearLengthMap.set(node.id, linearLength);
    state.result = linearLength;
}

function sumLinearLengths(
    state: State,
    initialLength: number,
    ...maybeNodes: (PQP.Language.Ast.TNode | undefined)[]
): number {
    let summedLinearLength: number = initialLength;
    for (const maybeNode of maybeNodes) {
        if (maybeNode) {
            const nodeLinearLength: number = getLinearLength(
                state.localizationTemplates,
                state.nodeIdMapCollection,
                state.linearLengthMap,
                maybeNode,
            );
            summedLinearLength += nodeLinearLength;
        }
    }

    return summedLinearLength;
}
