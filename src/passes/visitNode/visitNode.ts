// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { SerializeParameter, SerializeParameterState } from "../commonTypes";
import { getWorkspace, propagateWriteKind, setWorkspace } from "./visitNodeUtils";

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

export function visitNode(state: SerializeParameterState, node: PQP.Language.Ast.TNode): void {
    switch (node.kind) {
        case PQP.Language.Ast.NodeKind.ArrayWrapper:
            visitArrayWrapper(state, node);
            break;

        // TPairedConstant
        case PQP.Language.Ast.NodeKind.AsNullablePrimitiveType:
        case PQP.Language.Ast.NodeKind.AsType:
        case PQP.Language.Ast.NodeKind.EachExpression:
        case PQP.Language.Ast.NodeKind.IsNullablePrimitiveType:
        case PQP.Language.Ast.NodeKind.NullablePrimitiveType:
        case PQP.Language.Ast.NodeKind.NullableType:
        case PQP.Language.Ast.NodeKind.OtherwiseExpression:
            visitTPairedConstant(state, node);
            break;

        // TBinOpExpression
        case PQP.Language.Ast.NodeKind.ArithmeticExpression:
        case PQP.Language.Ast.NodeKind.AsExpression:
        case PQP.Language.Ast.NodeKind.EqualityExpression:
        case PQP.Language.Ast.NodeKind.IsExpression:
        case PQP.Language.Ast.NodeKind.LogicalExpression:
        case PQP.Language.Ast.NodeKind.NullCoalescingExpression:
        case PQP.Language.Ast.NodeKind.RelationalExpression:
            visitTBinOpExpression(state, node);
            break;

        // TKeyValuePair
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedAnyLiteral:
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedExpression:
        case PQP.Language.Ast.NodeKind.IdentifierPairedExpression:
            visitTKeyValuePair(state, node);
            break;

        case PQP.Language.Ast.NodeKind.ListLiteral:
        case PQP.Language.Ast.NodeKind.ListExpression:
        case PQP.Language.Ast.NodeKind.RecordExpression:
        case PQP.Language.Ast.NodeKind.RecordLiteral:
            visitTWrapped(state, node);
            break;

        case PQP.Language.Ast.NodeKind.Csv:
            visitTCsv(state, node);
            break;

        case PQP.Language.Ast.NodeKind.ErrorHandlingExpression:
            visitErrorHandlingExpression(state, node);
            break;

        case PQP.Language.Ast.NodeKind.ErrorRaisingExpression:
            visitErrorRaisingExpression(state, node);
            break;

        case PQP.Language.Ast.NodeKind.FieldProjection:
            visitTWrapped(state, node);
            break;

        case PQP.Language.Ast.NodeKind.FieldSelector:
            propagateWriteKind(state, node, node.openWrapperConstant);
            break;

        case PQP.Language.Ast.NodeKind.FieldSpecification:
            visitFieldSpecification(state, node);
            break;

        case PQP.Language.Ast.NodeKind.FieldSpecificationList:
            visitFieldSpecificationList(state, node);
            break;

        case PQP.Language.Ast.NodeKind.FieldTypeSpecification:
            visitFieldTypeSpecification(state, node);
            break;

        case PQP.Language.Ast.NodeKind.FunctionExpression:
            visitFunctionExpression(state, node);
            break;

        case PQP.Language.Ast.NodeKind.FunctionType:
            visitFunctionType(state, node);
            break;

        case PQP.Language.Ast.NodeKind.IdentifierExpression:
            visitIdentifierExpression(state, node);
            break;

        case PQP.Language.Ast.NodeKind.IfExpression:
            visitIfExpression(state, node);
            break;

        case PQP.Language.Ast.NodeKind.InvokeExpression:
            visitTWrapped(state, node);
            break;

        case PQP.Language.Ast.NodeKind.ItemAccessExpression:
            visitItemAccessExpression(state, node);
            break;

        case PQP.Language.Ast.NodeKind.LetExpression:
            visitLetExpression(state, node);
            break;

        case PQP.Language.Ast.NodeKind.ListType:
            visitListType(state, node);
            break;

        case PQP.Language.Ast.NodeKind.MetadataExpression:
            visitMetadataExpression(state, node);
            break;

        case PQP.Language.Ast.NodeKind.NotImplementedExpression:
            propagateWriteKind(state, node, node.ellipsisConstant);
            break;

        case PQP.Language.Ast.NodeKind.Parameter:
            visitTParameter(state, node);
            break;

        case PQP.Language.Ast.NodeKind.ParameterList:
            propagateWriteKind(state, node, node.openWrapperConstant);
            break;

        case PQP.Language.Ast.NodeKind.ParenthesizedExpression:
            visitParenthesizedExpression(state, node);
            break;

        case PQP.Language.Ast.NodeKind.RangeExpression:
            visitRangeExpression(state, node);
            break;

        case PQP.Language.Ast.NodeKind.RecordType: {
            const workspace: SerializeParameter = getWorkspace(state, node);
            setWorkspace(state, node.fields, workspace);
            break;
        }

        case PQP.Language.Ast.NodeKind.RecursivePrimaryExpression:
            propagateWriteKind(state, node, node.head);
            break;

        case PQP.Language.Ast.NodeKind.TableType:
            visitTableType(state, node);
            break;

        case PQP.Language.Ast.NodeKind.Section:
            visitSection(state, node);
            break;

        case PQP.Language.Ast.NodeKind.SectionMember:
            visitSectionMember(state, node);
            break;

        // TPairedConstant overload
        case PQP.Language.Ast.NodeKind.TypePrimaryType: {
            visitTypePrimaryType(state, node);
            break;
        }

        case PQP.Language.Ast.NodeKind.UnaryExpression:
            visitUnaryExpression(state, node);
            break;

        // Leaf nodes.
        // If a parent gave the leaf node a workspace it assigns indentationChange,
        // while writeType can be overwritten if the leaf node has a multiline comment attached.
        case PQP.Language.Ast.NodeKind.Constant:
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifier:
        case PQP.Language.Ast.NodeKind.Identifier:
        case PQP.Language.Ast.NodeKind.LiteralExpression:
        case PQP.Language.Ast.NodeKind.PrimitiveType:
            visitLeaf(state, node);
            break;

        default:
            throw PQP.Assert.isNever(node);
    }
}
