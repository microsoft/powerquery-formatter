// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast, AstUtils } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";
import { Trace, TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";
import { FormatTraceConstant } from "../../trace";

import {
    CommentCollection,
    CommentCollectionMap,
    IsMultilineFirstPassState,
    IsMultilineMap,
    LinearLengthMap,
} from "../commonTypes";
import { expectGetIsMultiline, setIsMultiline } from "./common";
import { getLinearLength } from "./linearLength";

export function tryTraverseIsMultilineFirstPass(
    ast: Ast.TNode,
    commentCollectionMap: CommentCollectionMap,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    locale: string,
    traceManager: TraceManager,
    maybeCorrelationId: number | undefined,
    cancellationToken: PQP.ICancellationToken | undefined,
): Promise<PQP.Traverse.TriedTraverse<IsMultilineMap>> {
    const state: IsMultilineFirstPassState = {
        locale,
        traceManager,
        cancellationToken,
        initialCorrelationId: maybeCorrelationId,
        commentCollectionMap,
        linearLengthMap: new Map(),
        nodeIdMapCollection,
        result: new Map(),
    };

    return PQP.Traverse.tryTraverseAst<IsMultilineFirstPassState, IsMultilineMap>(
        state,
        nodeIdMapCollection,
        ast,
        PQP.Traverse.VisitNodeStrategy.DepthFirst,
        visitNode,
        PQP.Traverse.assertGetAllAstChildren,
        undefined,
    );
}

const InvokeExpressionIdentifierLinearLengthExclusions: ReadonlyArray<string> = [
    "#datetime",
    "#datetimezone",
    "#duration",
    "#time",
];

const TBinOpExpressionLinearLengthThreshold: number = 40;
const InvokeExpressionLinearLengthThreshold: number = 40;

async function visitNode(
    state: IsMultilineFirstPassState,
    node: Ast.TNode,
    maybeCorrelationId: number | undefined,
): Promise<void> {
    const trace: Trace = state.traceManager.entry(
        FormatTraceConstant.IsMultilinePhase1,
        visitNode.name,
        maybeCorrelationId,
        {
            nodeId: node.id,
            nodeKind: node.kind,
        },
    );

    const isMultilineMap: IsMultilineMap = state.result;
    let isMultiline: boolean = false;

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
            isMultiline = isAnyMultiline(isMultilineMap, node.constant, node.paired);
            break;

        // TBinOpExpression
        case Ast.NodeKind.ArithmeticExpression:
        case Ast.NodeKind.AsExpression:
        case Ast.NodeKind.EqualityExpression:
        case Ast.NodeKind.IsExpression:
        case Ast.NodeKind.LogicalExpression:
        case Ast.NodeKind.NullCoalescingExpression:
        case Ast.NodeKind.RelationalExpression:
            isMultiline = await visitBinOpExpression(state, node, isMultilineMap, trace.id);
            break;

        // TKeyValuePair
        case Ast.NodeKind.GeneralizedIdentifierPairedAnyLiteral:
        case Ast.NodeKind.GeneralizedIdentifierPairedExpression:
        case Ast.NodeKind.IdentifierPairedExpression:
            isMultiline = isAnyMultiline(isMultilineMap, node.key, node.equalConstant, node.value);
            break;

        // Possible for a parent to assign an isMultiline override.
        case Ast.NodeKind.ArrayWrapper:
            isMultiline = isAnyMultiline(isMultilineMap, ...node.elements);
            break;

        case Ast.NodeKind.ListExpression:
        case Ast.NodeKind.ListLiteral:
        case Ast.NodeKind.RecordExpression:
        case Ast.NodeKind.RecordLiteral:
            isMultiline = visitListOrRecordNode(node, isMultilineMap);
            setIsMultiline(isMultilineMap, node.content, isMultiline);
            break;

        case Ast.NodeKind.Csv:
            isMultiline = isAnyMultiline(isMultilineMap, node.node, node.commaConstant);
            break;

        case Ast.NodeKind.ErrorHandlingExpression:
            isMultiline = isAnyMultiline(isMultilineMap, node.tryConstant, node.protectedExpression, node.handler);

            break;

        case Ast.NodeKind.FieldProjection:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.openWrapperConstant,
                node.closeWrapperConstant,
                node.optionalConstant,
                ...node.content.elements,
            );

            break;

        case Ast.NodeKind.FieldSelector:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
                node.optionalConstant,
            );

            break;

        case Ast.NodeKind.FieldSpecification:
            isMultiline = isAnyMultiline(isMultilineMap, node.optionalConstant, node.name, node.fieldTypeSpecification);

            break;

        case Ast.NodeKind.FieldSpecificationList: {
            const fieldArray: Ast.ICsvArray<Ast.FieldSpecification> = node.content;

            const fields: ReadonlyArray<Ast.ICsv<Ast.FieldSpecification>> = fieldArray.elements;

            if (fields.length > 1) {
                isMultiline = true;
            } else if (fields.length === 1 && node.openRecordMarkerConstant) {
                isMultiline = true;
            }

            setIsMultiline(isMultilineMap, fieldArray, isMultiline);
            break;
        }

        case Ast.NodeKind.FieldTypeSpecification:
            isMultiline = isAnyMultiline(isMultilineMap, node.equalConstant, node.fieldType);
            break;

        case Ast.NodeKind.FunctionExpression:
            isMultiline = expectGetIsMultiline(isMultilineMap, node.expression);
            break;

        case Ast.NodeKind.IdentifierExpression: {
            isMultiline = isAnyMultiline(isMultilineMap, node.inclusiveConstant, node.identifier);
            break;
        }

        case Ast.NodeKind.IfExpression:
            isMultiline = true;
            break;

        case Ast.NodeKind.InvokeExpression: {
            const nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection = state.nodeIdMapCollection;
            const args: ReadonlyArray<Ast.ICsv<Ast.TExpression>> = node.content.elements;

            if (args.length > 1) {
                const linearLengthMap: LinearLengthMap = state.linearLengthMap;

                const linearLength: number = await getLinearLength(
                    nodeIdMapCollection,
                    linearLengthMap,
                    node,
                    state.locale,
                    state.traceManager,
                    trace.id,
                    state.cancellationToken,
                );

                const maybeArrayWrapper: Ast.TNode | undefined = PQP.Parser.NodeIdMapUtils.parentAst(
                    nodeIdMapCollection,
                    node.id,
                );

                if (maybeArrayWrapper === undefined || maybeArrayWrapper.kind !== Ast.NodeKind.ArrayWrapper) {
                    throw new PQP.CommonError.InvariantError("InvokeExpression must have ArrayWrapper as a parent");
                }

                const arrayWrapper: Ast.IArrayWrapper<Ast.TNode> = maybeArrayWrapper;

                const maybeRecursivePrimaryExpression: Ast.TNode | undefined = PQP.Parser.NodeIdMapUtils.parentAst(
                    nodeIdMapCollection,
                    arrayWrapper.id,
                );

                if (
                    maybeRecursivePrimaryExpression === undefined ||
                    maybeRecursivePrimaryExpression.kind !== Ast.NodeKind.RecursivePrimaryExpression
                ) {
                    throw new PQP.CommonError.InvariantError(
                        "ArrayWrapper must have RecursivePrimaryExpression as a parent",
                    );
                }

                const recursivePrimaryExpression: Ast.RecursivePrimaryExpression = maybeRecursivePrimaryExpression;

                const headLinearLength: number = await getLinearLength(
                    nodeIdMapCollection,
                    linearLengthMap,
                    recursivePrimaryExpression.head,
                    state.locale,
                    state.traceManager,
                    trace.id,
                    state.cancellationToken,
                );

                const compositeLinearLength: number = headLinearLength + linearLength;

                // if it's beyond the threshold check if it's a long literal
                // ex. `#datetimezone(2013,02,26, 09,15,00, 09,00)`
                if (compositeLinearLength > InvokeExpressionLinearLengthThreshold) {
                    const maybeIdentifierLiteral: string | undefined =
                        PQP.Parser.NodeIdMapUtils.invokeExpressionIdentifierLiteral(nodeIdMapCollection, node.id);

                    if (maybeIdentifierLiteral) {
                        const name: string = maybeIdentifierLiteral;
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

        case Ast.NodeKind.ItemAccessExpression:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.optionalConstant,
                node.content,
                node.closeWrapperConstant,
                node.optionalConstant,
            );

            break;

        case Ast.NodeKind.LetExpression:
            isMultiline = true;
            setIsMultiline(isMultilineMap, node.variableList, true);
            break;

        case Ast.NodeKind.LiteralExpression:
            if (node.literalKind === Ast.LiteralKind.Text && containsNewline(node.literal)) {
                isMultiline = true;
            }

            break;

        case Ast.NodeKind.ListType:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
            );

            break;

        case Ast.NodeKind.MetadataExpression:
            isMultiline = isAnyMultiline(isMultilineMap, node.left, node.operatorConstant, node.right);
            break;

        case Ast.NodeKind.ParenthesizedExpression:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.openWrapperConstant,
                node.content,
                node.closeWrapperConstant,
            );

            break;

        case Ast.NodeKind.RangeExpression:
            isMultiline = isAnyMultiline(isMultilineMap, node.left, node.rangeConstant, node.right);
            break;

        case Ast.NodeKind.RecordType:
            isMultiline = expectGetIsMultiline(isMultilineMap, node.fields);
            break;

        case Ast.NodeKind.RecursivePrimaryExpression:
            isMultiline = isAnyMultiline(isMultilineMap, node.head, ...node.recursiveExpressions.elements);
            break;

        case Ast.NodeKind.Section:
            if (node.sectionMembers.elements.length) {
                isMultiline = true;
            } else {
                isMultiline = isAnyMultiline(
                    isMultilineMap,
                    node.literalAttributes,
                    node.sectionConstant,
                    node.name,
                    node.semicolonConstant,
                    ...node.sectionMembers.elements,
                );
            }

            break;

        case Ast.NodeKind.SectionMember:
            isMultiline = isAnyMultiline(
                isMultilineMap,
                node.literalAttributes,
                node.sharedConstant,
                node.namePairedExpression,
                node.semicolonConstant,
            );

            break;

        case Ast.NodeKind.TableType:
            isMultiline = isAnyMultiline(isMultilineMap, node.tableConstant, node.rowType);
            break;

        case Ast.NodeKind.UnaryExpression:
            isMultiline = isAnyMultiline(isMultilineMap, ...node.operators.elements);
            break;

        // no-op nodes
        case Ast.NodeKind.Constant:
        case Ast.NodeKind.FunctionType:
        case Ast.NodeKind.GeneralizedIdentifier:
        case Ast.NodeKind.Identifier:
        case Ast.NodeKind.NotImplementedExpression:
        case Ast.NodeKind.Parameter:
        case Ast.NodeKind.ParameterList:
        case Ast.NodeKind.PrimitiveType:
            break;

        default:
            throw PQP.Assert.isNever(node);
    }

    setIsMultilineWithCommentCheck(state, node, isMultiline);

    trace.exit({ isMultiline });
}

async function visitBinOpExpression(
    state: IsMultilineFirstPassState,
    node: Ast.TBinOpExpression,
    isMultilineMap: IsMultilineMap,
    correlationId: number,
): Promise<boolean> {
    const trace: Trace = state.traceManager.entry(
        FormatTraceConstant.IsMultilinePhase1,
        visitBinOpExpression.name,
        correlationId,
    );

    const left: Ast.TNode = node.left;
    const right: Ast.TNode = node.right;

    let isMultiline: boolean;

    if (
        (AstUtils.isTBinOpExpression(left) && containsLogicalExpression(left)) ||
        (AstUtils.isTBinOpExpression(right) && containsLogicalExpression(right))
    ) {
        isMultiline = true;
    }

    const linearLength: number = await getLinearLength(
        state.nodeIdMapCollection,
        state.linearLengthMap,
        node,
        state.locale,
        state.traceManager,
        trace.id,
        state.cancellationToken,
    );

    if (linearLength > TBinOpExpressionLinearLengthThreshold) {
        isMultiline = true;
    } else {
        isMultiline = isAnyMultiline(isMultilineMap, left, node.operatorConstant, right);
    }

    trace.exit();

    return isMultiline;
}

function visitListOrRecordNode(
    node: Ast.ListExpression | Ast.ListLiteral | Ast.RecordExpression | Ast.RecordLiteral,
    isMultilineMap: IsMultilineMap,
): boolean {
    if (node.content.elements.length > 1) {
        return true;
    } else {
        const isAnyChildMultiline: boolean = isAnyMultiline(
            isMultilineMap,
            node.openWrapperConstant,
            node.closeWrapperConstant,
            ...node.content.elements,
        );

        if (isAnyChildMultiline) {
            return true;
        } else {
            const csvs: ReadonlyArray<Ast.TCsv> = node.content.elements;

            const csvNodes: ReadonlyArray<Ast.TNode> = csvs.map((csv: Ast.TCsv) => csv.node);

            return isAnyListOrRecord(csvNodes);
        }
    }
}

function isAnyListOrRecord(nodes: ReadonlyArray<Ast.TNode>): boolean {
    for (const node of nodes) {
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
        switch (node.kind) {
            case Ast.NodeKind.ListExpression:
            case Ast.NodeKind.ListLiteral:
            case Ast.NodeKind.RecordExpression:
            case Ast.NodeKind.RecordLiteral:
                return true;
        }
    }

    return false;
}

function isAnyMultiline(isMultilineMap: IsMultilineMap, ...maybeNodes: (Ast.TNode | undefined)[]): boolean {
    for (const maybeNode of maybeNodes) {
        if (maybeNode && expectGetIsMultiline(isMultilineMap, maybeNode)) {
            return true;
        }
    }

    return false;
}

function setIsMultilineWithCommentCheck(state: IsMultilineFirstPassState, node: Ast.TNode, isMultiline: boolean): void {
    if (precededByMultilineComment(state, node)) {
        isMultiline = true;
    }

    setIsMultiline(state.result, node, isMultiline);
}

function precededByMultilineComment(state: IsMultilineFirstPassState, node: Ast.TNode): boolean {
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
        if (PQP.StringUtils.newlineKindAt(text, index)) {
            return true;
        }
    }

    return false;
}

function containsLogicalExpression(node: Ast.TBinOpExpression): boolean {
    if (!AstUtils.isTBinOpExpression(node)) {
        return false;
    }

    const left: Ast.TNode = node.left;
    const right: Ast.TNode = node.right;

    return (
        node.kind === Ast.NodeKind.LogicalExpression ||
        (AstUtils.isTBinOpExpression(left) && containsLogicalExpression(left)) ||
        (AstUtils.isTBinOpExpression(right) && containsLogicalExpression(right))
    );
}
