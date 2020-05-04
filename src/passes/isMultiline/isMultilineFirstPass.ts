// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { CommentCollection, CommentCollectionMap } from "../comment";
import { expectGetIsMultiline, IsMultilineMap, setIsMultiline } from "./common";
import { getLinearLength, LinearLengthMap } from "./linearLength";

export function tryTraverse(
    localizationTemplates: PQP.ILocalizationTemplates,
    ast: PQP.Language.Ast.TNode,
    commentCollectionMap: CommentCollectionMap,
    nodeIdMapCollection: PQP.NodeIdMap.Collection,
): PQP.Traverse.TriedTraverse<IsMultilineMap> {
    const state: State = {
        localizationTemplates,
        result: new Map(),
        commentCollectionMap,
        nodeIdMapCollection,
        linearLengthMap: new Map(),
    };

    return PQP.Traverse.tryTraverseAst<State, IsMultilineMap>(
        state,
        nodeIdMapCollection,
        ast,
        PQP.Traverse.VisitNodeStrategy.DepthFirst,
        visitNode,
        PQP.Traverse.expectExpandAllAstChildren,
        undefined,
    );
}

export interface State extends PQP.Traverse.IState<IsMultilineMap> {
    readonly localizationTemplates: PQP.ILocalizationTemplates;
    readonly commentCollectionMap: CommentCollectionMap;
    readonly nodeIdMapCollection: PQP.NodeIdMap.Collection;
    readonly linearLengthMap: LinearLengthMap;
}

const InvokeExpressionIdentifierLinearLengthExclusions: ReadonlyArray<string> = [
    "#datetime",
    "#datetimezone",
    "#duration",
    "#time",
];
const TBinOpExpressionLinearLengthThreshold: number = 40;
const InvokeExpressionLinearLengthThreshold: number = 40;

function visitNode(state: State, node: PQP.Language.Ast.TNode): void {
    const isMultilineMap: IsMultilineMap = state.result;
    let isMultiline: boolean = false;

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
            isMultiline = isAnyMultiline(isMultilineMap, node.constant, node.paired);
            break;

        // TBinOpExpression
        case PQP.Language.Ast.NodeKind.IsExpression:
        case PQP.Language.Ast.NodeKind.AsExpression:
        case PQP.Language.Ast.NodeKind.ArithmeticExpression:
        case PQP.Language.Ast.NodeKind.EqualityExpression:
        case PQP.Language.Ast.NodeKind.LogicalExpression:
        case PQP.Language.Ast.NodeKind.RelationalExpression: {
            const left: PQP.Language.Ast.TNode = node.left;
            const right: PQP.Language.Ast.TNode = node.right;

            if (
                (PQP.Language.AstUtils.isTBinOpExpression(left) && containsLogicalExpression(left)) ||
                (PQP.Language.AstUtils.isTBinOpExpression(right) && containsLogicalExpression(right))
            ) {
                isMultiline = true;
            }
            const linearLength: number = getLinearLength(
                state.localizationTemplates,
                state.nodeIdMapCollection,
                state.linearLengthMap,
                node,
            );
            if (linearLength > TBinOpExpressionLinearLengthThreshold) {
                isMultiline = true;
            } else {
                isMultiline = isAnyMultiline(isMultilineMap, left, node.operatorConstant, right);
            }

            break;
        }

        // TKeyValuePair
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedAnyLiteral:
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedExpression:
        case PQP.Language.Ast.NodeKind.IdentifierPairedExpression:
            isMultiline = isAnyMultiline(isMultilineMap, node.key, node.equalConstant, node.value);
            break;

        // Possible for a parent to assign an isMultiline override.
        case PQP.Language.Ast.NodeKind.ArrayWrapper:
            isMultiline = isAnyMultiline(isMultilineMap, ...node.elements);
            break;

        case PQP.Language.Ast.NodeKind.ListExpression:
        case PQP.Language.Ast.NodeKind.ListLiteral:
        case PQP.Language.Ast.NodeKind.RecordExpression:
        case PQP.Language.Ast.NodeKind.RecordLiteral: {
            if (node.content.elements.length > 1) {
                isMultiline = true;
            } else {
                const isAnyChildMultiline: boolean = isAnyMultiline(
                    isMultilineMap,
                    node.openWrapperConstant,
                    node.closeWrapperConstant,
                    ...node.content.elements,
                );
                if (isAnyChildMultiline) {
                    isMultiline = true;
                } else {
                    const csvs: ReadonlyArray<PQP.Language.Ast.TCsv> = node.content.elements;
                    const csvNodes: ReadonlyArray<PQP.Language.Ast.TNode> = csvs.map(
                        (csv: PQP.Language.Ast.TCsv) => csv.node,
                    );
                    isMultiline = isAnyListOrRecord(csvNodes);
                }
            }

            setIsMultiline(isMultilineMap, node.content, isMultiline);
            break;
        }

        case PQP.Language.Ast.NodeKind.Csv:
            isMultiline = isAnyMultiline(isMultilineMap, node.node, node.maybeCommaConstant);
            break;

        case PQP.Language.Ast.NodeKind.ErrorHandlingExpression:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.tryConstant,
                node.protectedExpression,
                node.maybeOtherwiseExpression,
            );
            break;

        case PQP.Language.Ast.NodeKind.FieldProjection:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.openWrapperConstant,
                node.closeWrapperConstant,
                node.maybeOptionalConstant,
                ...node.content.elements,
            );
            break;

        case PQP.Language.Ast.NodeKind.FieldSelector:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
                node.maybeOptionalConstant,
            );
            break;

        case PQP.Language.Ast.NodeKind.FieldSpecification:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.maybeOptionalConstant,
                node.name,
                node.maybeFieldTypeSpecification,
            );
            break;

        case PQP.Language.Ast.NodeKind.FieldSpecificationList: {
            const fieldArray: PQP.Language.Ast.ICsvArray<PQP.Language.Ast.FieldSpecification> = node.content;
            const fields: ReadonlyArray<PQP.Language.Ast.ICsv<PQP.Language.Ast.FieldSpecification>> =
                fieldArray.elements;
            if (fields.length > 1) {
                isMultiline = true;
            } else if (fields.length === 1 && node.maybeOpenRecordMarkerConstant) {
                isMultiline = true;
            }
            setIsMultiline(isMultilineMap, fieldArray, isMultiline);
            break;
        }

        case PQP.Language.Ast.NodeKind.FieldTypeSpecification:
            isMultiline = isAnyMultiline(isMultilineMap, node.equalConstant, node.fieldType);
            break;

        case PQP.Language.Ast.NodeKind.FunctionExpression:
            isMultiline = expectGetIsMultiline(isMultilineMap, node.expression);
            break;

        case PQP.Language.Ast.NodeKind.IdentifierExpression: {
            isMultiline = isAnyMultiline(isMultilineMap, node.maybeInclusiveConstant, node.identifier);
            break;
        }

        case PQP.Language.Ast.NodeKind.IfExpression:
            isMultiline = true;
            break;

        case PQP.Language.Ast.NodeKind.InvokeExpression: {
            const nodeIdMapCollection: PQP.NodeIdMap.Collection = state.nodeIdMapCollection;
            const args: ReadonlyArray<PQP.Language.Ast.ICsv<PQP.Language.Ast.TExpression>> = node.content.elements;

            if (args.length > 1) {
                const linearLengthMap: LinearLengthMap = state.linearLengthMap;
                const linearLength: number = getLinearLength(
                    state.localizationTemplates,
                    nodeIdMapCollection,
                    linearLengthMap,
                    node,
                );

                const maybeArrayWrapper: PQP.Language.Ast.TNode | undefined = PQP.NodeIdMapUtils.maybeParentAstNode(
                    nodeIdMapCollection,
                    node.id,
                );
                if (
                    maybeArrayWrapper === undefined ||
                    maybeArrayWrapper.kind !== PQP.Language.Ast.NodeKind.ArrayWrapper
                ) {
                    throw new PQP.CommonError.InvariantError("InvokeExpression must have ArrayWrapper as a parent");
                }
                const arrayWrapper: PQP.Language.Ast.IArrayWrapper<PQP.Language.Ast.TNode> = maybeArrayWrapper;

                const maybeRecursivePrimaryExpression:
                    | PQP.Language.Ast.TNode
                    | undefined = PQP.NodeIdMapUtils.maybeParentAstNode(nodeIdMapCollection, arrayWrapper.id);
                if (
                    maybeRecursivePrimaryExpression === undefined ||
                    maybeRecursivePrimaryExpression.kind !== PQP.Language.Ast.NodeKind.RecursivePrimaryExpression
                ) {
                    throw new PQP.CommonError.InvariantError(
                        "ArrayWrapper must have RecursivePrimaryExpression as a parent",
                    );
                }
                const recursivePrimaryExpression: PQP.Language.Ast.RecursivePrimaryExpression = maybeRecursivePrimaryExpression;

                const headLinearLength: number = getLinearLength(
                    state.localizationTemplates,
                    nodeIdMapCollection,
                    linearLengthMap,
                    recursivePrimaryExpression.head,
                );
                const compositeLinearLength: number = headLinearLength + linearLength;

                // if it's beyond the threshold check if it's a long literal
                // ex. `#datetimezone(2013,02,26, 09,15,00, 09,00)`
                if (compositeLinearLength > InvokeExpressionLinearLengthThreshold) {
                    const maybeName: string | undefined = PQP.NodeIdMapUtils.maybeInvokeExpressionName(
                        nodeIdMapCollection,
                        node.id,
                    );
                    if (maybeName) {
                        const name: string = maybeName;
                        isMultiline = InvokeExpressionIdentifierLinearLengthExclusions.indexOf(name) === -1;
                    }

                    setIsMultiline(isMultilineMap, node.content, isMultiline);
                } else {
                    isMultiline = isAnyMultiline(
                        isMultilineMap,
                        node.openWrapperConstant,
                        node.closeWrapperConstant,
                        ...args,
                    );
                }
            } else {
                // a single argument can still be multiline
                // ex. `foo(if true then 1 else 0)`
                isMultiline = isAnyMultiline(
                    isMultilineMap,
                    node.openWrapperConstant,
                    node.closeWrapperConstant,
                    ...args,
                );
            }
            break;
        }

        case PQP.Language.Ast.NodeKind.ItemAccessExpression:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.maybeOptionalConstant,
                node.content,
                node.closeWrapperConstant,
                node.maybeOptionalConstant,
            );
            break;

        case PQP.Language.Ast.NodeKind.LetExpression:
            isMultiline = true;
            setIsMultiline(isMultilineMap, node.variableList, true);
            break;

        case PQP.Language.Ast.NodeKind.LiteralExpression:
            if (node.literalKind === PQP.Language.Ast.LiteralKind.Text && containsNewline(node.literal)) {
                isMultiline = true;
            }
            break;

        case PQP.Language.Ast.NodeKind.ListType:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
            );
            break;

        case PQP.Language.Ast.NodeKind.MetadataExpression:
            isMultiline = isAnyMultiline(isMultilineMap, node.left, node.operatorConstant, node.right);
            break;

        case PQP.Language.Ast.NodeKind.ParenthesizedExpression:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
            );
            break;

        case PQP.Language.Ast.NodeKind.PrimitiveType:
            isMultiline = expectGetIsMultiline(isMultilineMap, node.primitiveType);
            break;

        case PQP.Language.Ast.NodeKind.RangeExpression:
            isMultiline = isAnyMultiline(isMultilineMap, node.left, node.rangeConstant, node.right);
            break;

        case PQP.Language.Ast.NodeKind.RecordType:
            isMultiline = expectGetIsMultiline(isMultilineMap, node.fields);
            break;

        case PQP.Language.Ast.NodeKind.RecursivePrimaryExpression:
            isMultiline = isAnyMultiline(isMultilineMap, node.head, ...node.recursiveExpressions.elements);
            break;

        case PQP.Language.Ast.NodeKind.Section:
            if (node.sectionMembers.elements.length) {
                isMultiline = true;
            } else {
                isMultiline = isAnyMultiline(
                    isMultilineMap,
                    node.maybeLiteralAttributes,
                    node.sectionConstant,
                    node.maybeName,
                    node.semicolonConstant,
                    ...node.sectionMembers.elements,
                );
            }
            break;

        case PQP.Language.Ast.NodeKind.SectionMember:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.maybeLiteralAttributes,
                node.maybeSharedConstant,
                node.namePairedExpression,
                node.semicolonConstant,
            );
            break;

        case PQP.Language.Ast.NodeKind.TableType:
            isMultiline = isAnyMultiline(isMultilineMap, node.tableConstant, node.rowType);
            break;

        case PQP.Language.Ast.NodeKind.UnaryExpression:
            isMultiline = isAnyMultiline(isMultilineMap, ...node.operators.elements);
            break;

        // no-op nodes
        case PQP.Language.Ast.NodeKind.Constant:
        case PQP.Language.Ast.NodeKind.FunctionType:
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifier:
        case PQP.Language.Ast.NodeKind.Identifier:
        case PQP.Language.Ast.NodeKind.NotImplementedExpression:
        case PQP.Language.Ast.NodeKind.Parameter:
        case PQP.Language.Ast.NodeKind.ParameterList:
            break;

        default:
            throw PQP.isNever(node);
    }

    setIsMultilineWithCommentCheck(state, node, isMultiline);
}

function isAnyListOrRecord(nodes: ReadonlyArray<PQP.Language.Ast.TNode>): boolean {
    for (const node of nodes) {
        // tslint:disable-next-line: switch-default
        switch (node.kind) {
            case PQP.Language.Ast.NodeKind.ListExpression:
            case PQP.Language.Ast.NodeKind.ListLiteral:
            case PQP.Language.Ast.NodeKind.RecordExpression:
            case PQP.Language.Ast.NodeKind.RecordLiteral:
                return true;
        }
    }

    return false;
}

function isAnyMultiline(
    isMultilineMap: IsMultilineMap,
    ...maybeNodes: (PQP.Language.Ast.TNode | undefined)[]
): boolean {
    for (const maybeNode of maybeNodes) {
        if (maybeNode && expectGetIsMultiline(isMultilineMap, maybeNode)) {
            return true;
        }
    }

    return false;
}

function setIsMultilineWithCommentCheck(state: State, node: PQP.Language.Ast.TNode, isMultiline: boolean): void {
    if (precededByMultilineComment(state, node)) {
        isMultiline = true;
    }

    setIsMultiline(state.result, node, isMultiline);
}

function precededByMultilineComment(state: State, node: PQP.Language.Ast.TNode): boolean {
    const maybeCommentCollection: CommentCollection | undefined = state.commentCollectionMap.get(node.id);
    if (maybeCommentCollection) {
        return maybeCommentCollection.prefixedCommentsContainsNewline;
    } else {
        return false;
    }
}

function containsNewline(text: string): boolean {
    const textLength: number = text.length;

    for (let index: number = 0; index < textLength; index += 1) {
        if (PQP.StringUtils.maybeNewlineKindAt(text, index)) {
            return true;
        }
    }
    return false;
}

function containsLogicalExpression(node: PQP.Language.Ast.TBinOpExpression): boolean {
    if (!PQP.Language.AstUtils.isTBinOpExpression(node)) {
        return false;
    }
    const left: PQP.Language.Ast.TNode = node.left;
    const right: PQP.Language.Ast.TNode = node.right;

    return (
        node.kind === PQP.Language.Ast.NodeKind.LogicalExpression ||
        (PQP.Language.AstUtils.isTBinOpExpression(left) && containsLogicalExpression(left)) ||
        (PQP.Language.AstUtils.isTBinOpExpression(right) && containsLogicalExpression(right))
    );
}
