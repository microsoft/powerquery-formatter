// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";
import { Trace } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";

import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState } from "../commonTypes";
import { FormatTraceConstant } from "../../trace";
import { visitArrayWrapper } from "./visitArrayWrapper";
import { visitErrorHandlingExpression } from "./visitErrorHandlingExpression";
import { visitErrorRaisingExpression } from "./visitErrorRaisingExpression";
import { visitFieldSpecification } from "./visitFieldSpecification";
import { visitFieldSpecificationList } from "./visitFieldSpecificationList";
import { visitFieldTypeSpecification } from "./visitFieldTypeSpecification";
import { visitFunctionExpression } from "./visitFunctionExpression";
import { visitFunctionType } from "./visitFunctionType";
import { visitIdentifierExpression } from "./visitIdentifierExpression";
import { visitIfExpression } from "./visitIfExpression";
import { visitItemAccessExpression } from "./visitItemAccessExpression";
import { visitLeaf } from "./visitLeaf";
import { visitLetExpression } from "./visitLetExpression";
import { visitListType } from "./visitListType";
import { visitMetadataExpression } from "./visitMetadataExpression";
import { visitParenthesizedExpression } from "./visitParenthesizedExpression";
import { visitRangeExpression } from "./visitRangeExpression";
import { visitSection } from "./visitSection";
import { visitSectionMember } from "./visitSectionMember";
import { visitTableType } from "./visitTableType";
import { visitTBinOpExpression } from "./visitTBinOpExpression";
import { visitTCsv } from "./visitTCsv";
import { visitTKeyValuePair } from "./visitTKeyValuePair";
import { visitTPairedConstant } from "./visitTPairedConstant";
import { visitTParameter } from "./visitTParameter";
import { visitTWrapped } from "./visitTWrapped";
import { visitTypePrimaryType } from "./visitTypePrimaryType";
import { visitUnaryExpression } from "./visitUnaryExpression";

// eslint-disable-next-line require-await
export async function visitNode(
    state: SerializeParameterState,
    node: Ast.TNode,
    maybeCorrelationId: number | undefined,
): Promise<void> {
    const trace: Trace = state.traceManager.entry(
        FormatTraceConstant.SerializeParameter,
        visitNode.name,
        maybeCorrelationId,
        {
            nodeId: node.id,
            nodeKind: node.kind,
        },
    );

    switch (node.kind) {
        case Ast.NodeKind.ArrayWrapper:
            visitArrayWrapper(state, node);
            break;

        // TPairedConstant
        case Ast.NodeKind.AsNullablePrimitiveType:
        case Ast.NodeKind.AsType:
        case Ast.NodeKind.EachExpression:
        case Ast.NodeKind.IsNullablePrimitiveType:
        case Ast.NodeKind.NullablePrimitiveType:
        case Ast.NodeKind.NullableType:
        case Ast.NodeKind.OtherwiseExpression:
            visitTPairedConstant(state, node);
            break;

        // TBinOpExpression
        case Ast.NodeKind.ArithmeticExpression:
        case Ast.NodeKind.AsExpression:
        case Ast.NodeKind.EqualityExpression:
        case Ast.NodeKind.IsExpression:
        case Ast.NodeKind.LogicalExpression:
        case Ast.NodeKind.NullCoalescingExpression:
        case Ast.NodeKind.RelationalExpression:
            visitTBinOpExpression(state, node);
            break;

        // TKeyValuePair
        case Ast.NodeKind.GeneralizedIdentifierPairedAnyLiteral:
        case Ast.NodeKind.GeneralizedIdentifierPairedExpression:
        case Ast.NodeKind.IdentifierPairedExpression:
            visitTKeyValuePair(state, node);
            break;

        case Ast.NodeKind.ListLiteral:
        case Ast.NodeKind.ListExpression:
        case Ast.NodeKind.RecordExpression:
        case Ast.NodeKind.RecordLiteral:
            visitTWrapped(state, node);
            break;

        case Ast.NodeKind.Csv:
            visitTCsv(state, node);
            break;

        case Ast.NodeKind.ErrorHandlingExpression:
            visitErrorHandlingExpression(state, node);
            break;

        case Ast.NodeKind.ErrorRaisingExpression:
            visitErrorRaisingExpression(state, node);
            break;

        case Ast.NodeKind.FieldProjection:
            visitTWrapped(state, node);
            break;

        case Ast.NodeKind.FieldSelector:
            propagateWriteKind(state, node, node.openWrapperConstant);
            break;

        case Ast.NodeKind.FieldSpecification:
            visitFieldSpecification(state, node);
            break;

        case Ast.NodeKind.FieldSpecificationList:
            visitFieldSpecificationList(state, node);
            break;

        case Ast.NodeKind.FieldTypeSpecification:
            visitFieldTypeSpecification(state, node);
            break;

        case Ast.NodeKind.FunctionExpression:
            visitFunctionExpression(state, node);
            break;

        case Ast.NodeKind.FunctionType:
            visitFunctionType(state, node);
            break;

        case Ast.NodeKind.IdentifierExpression:
            visitIdentifierExpression(state, node);
            break;

        case Ast.NodeKind.IfExpression:
            visitIfExpression(state, node);
            break;

        case Ast.NodeKind.InvokeExpression:
            visitTWrapped(state, node);
            break;

        case Ast.NodeKind.ItemAccessExpression:
            visitItemAccessExpression(state, node);
            break;

        case Ast.NodeKind.LetExpression:
            visitLetExpression(state, node);
            break;

        case Ast.NodeKind.ListType:
            visitListType(state, node);
            break;

        case Ast.NodeKind.MetadataExpression:
            visitMetadataExpression(state, node);
            break;

        case Ast.NodeKind.NotImplementedExpression:
            propagateWriteKind(state, node, node.ellipsisConstant);
            break;

        case Ast.NodeKind.Parameter:
            visitTParameter(state, node);
            break;

        case Ast.NodeKind.ParameterList:
            propagateWriteKind(state, node, node.openWrapperConstant);
            break;

        case Ast.NodeKind.ParenthesizedExpression:
            visitParenthesizedExpression(state, node);
            break;

        case Ast.NodeKind.RangeExpression:
            visitRangeExpression(state, node);
            break;

        case Ast.NodeKind.RecordType: {
            const workspace: SerializeParameter = getWorkspace(state, node);
            setWorkspace(state, node.fields, workspace);
            break;
        }

        case Ast.NodeKind.RecursivePrimaryExpression:
            propagateWriteKind(state, node, node.head);
            break;

        case Ast.NodeKind.TableType:
            visitTableType(state, node);
            break;

        case Ast.NodeKind.Section:
            visitSection(state, node);
            break;

        case Ast.NodeKind.SectionMember:
            visitSectionMember(state, node);
            break;

        // TPairedConstant overload
        case Ast.NodeKind.TypePrimaryType: {
            visitTypePrimaryType(state, node);
            break;
        }

        case Ast.NodeKind.UnaryExpression:
            visitUnaryExpression(state, node);
            break;

        // Leaf nodes.
        // If a parent gave the leaf node a workspace it assigns indentationChange,
        // while writeType can be overwritten if the leaf node has a multiline comment attached.
        case Ast.NodeKind.Constant:
        case Ast.NodeKind.GeneralizedIdentifier:
        case Ast.NodeKind.Identifier:
        case Ast.NodeKind.LiteralExpression:
        case Ast.NodeKind.PrimitiveType:
            visitLeaf(state, node);
            break;

        default:
            throw PQP.Assert.isNever(node);
    }

    trace.exit();
}
