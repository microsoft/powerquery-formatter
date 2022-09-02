// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast, AstUtils } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";
import { Trace, TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";

import { expectGetIsMultiline, setIsMultiline } from "./common";
import { IsMultilineMap, IsMultilineSecondPassState } from "../commonTypes";
import { FormatTraceConstant } from "../../trace";

export function tryTraverseIsMultilineSecondPass(
    ast: Ast.TNode,
    isMultilineMap: IsMultilineMap,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    locale: string,
    traceManager: TraceManager,
    correlationId: number | undefined,
    cancellationToken: PQP.ICancellationToken | undefined,
): Promise<PQP.Traverse.TriedTraverse<IsMultilineMap>> {
    const state: IsMultilineSecondPassState = {
        locale,
        traceManager,
        cancellationToken,
        initialCorrelationId: correlationId,
        nodeIdMapCollection,
        result: isMultilineMap,
    };

    return PQP.Traverse.tryTraverseAst(
        state,
        nodeIdMapCollection,
        ast,
        PQP.Traverse.VisitNodeStrategy.BreadthFirst,
        visitNode,
        PQP.Traverse.assertGetAllAstChildren,
        undefined,
    );
}

// eslint-disable-next-line require-await
async function visitNode(
    state: IsMultilineSecondPassState,
    node: Ast.TNode,
    correlationId: number | undefined,
): Promise<void> {
    const trace: Trace = state.traceManager.entry(
        FormatTraceConstant.IsMultilinePhase2,
        visitNode.name,
        correlationId,
        {
            nodeId: node.id,
            nodeKind: node.kind,
        },
    );

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (node.kind) {
        // TBinOpExpression
        case Ast.NodeKind.ArithmeticExpression:
        case Ast.NodeKind.AsExpression:
        case Ast.NodeKind.EqualityExpression:
        case Ast.NodeKind.IsExpression:
        case Ast.NodeKind.LogicalExpression:
        case Ast.NodeKind.RelationalExpression:
            visitBinOpExpression(state, node, trace);
            break;

        // If a list or record is a child node,
        // Then by default it should be considered multiline if it has one or more values
        case Ast.NodeKind.ListExpression:
        case Ast.NodeKind.ListLiteral:
        case Ast.NodeKind.RecordExpression:
        case Ast.NodeKind.RecordLiteral:
            visitListOrRecord(state, node, trace);
    }

    trace.exit();
}

function visitBinOpExpression(state: IsMultilineSecondPassState, node: Ast.TNode, trace: Trace): void {
    const isMultilineMap: IsMultilineMap = state.result;
    const parent: Ast.TNode | undefined = PQP.Parser.NodeIdMapUtils.parentAst(state.nodeIdMapCollection, node.id);

    if (parent && AstUtils.isTBinOpExpression(parent) && expectGetIsMultiline(isMultilineMap, parent)) {
        trace.trace("Updating isMultiline for nested BinOp", { nodeId: node.id, nodeKind: node.kind });

        setIsMultiline(isMultilineMap, node, true);
    }
}

function visitListOrRecord(
    state: IsMultilineSecondPassState,
    node: Ast.ListExpression | Ast.ListLiteral | Ast.RecordExpression | Ast.RecordLiteral,
    trace: Trace,
): void {
    if (node.content.elements.length) {
        trace.trace("Updating isMultiline for collection");

        const nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection = state.nodeIdMapCollection;

        let parent: Ast.TNode | undefined = PQP.Parser.NodeIdMapUtils.parentAst(nodeIdMapCollection, node.id);
        let csv: Ast.TCsv | undefined;
        let arrayWrapper: Ast.TArrayWrapper | undefined;

        if (parent && parent.kind === Ast.NodeKind.Csv) {
            csv = parent;
            parent = PQP.Parser.NodeIdMapUtils.parentAst(nodeIdMapCollection, parent.id);
        }

        if (parent && parent.kind === Ast.NodeKind.ArrayWrapper) {
            arrayWrapper = parent;
            parent = PQP.Parser.NodeIdMapUtils.parentAst(nodeIdMapCollection, parent.id);
        }

        if (parent) {
            switch (parent.kind) {
                case Ast.NodeKind.ItemAccessExpression:
                case Ast.NodeKind.InvokeExpression:
                case Ast.NodeKind.FunctionExpression:
                case Ast.NodeKind.Section:
                case Ast.NodeKind.SectionMember:
                    break;

                default: {
                    const isMultilineMap: IsMultilineMap = state.result;
                    setIsMultiline(isMultilineMap, parent, true);

                    if (csv) {
                        setIsMultiline(isMultilineMap, csv, true);
                    }

                    if (arrayWrapper) {
                        setIsMultiline(isMultilineMap, arrayWrapper, true);
                    }

                    setIsMultiline(isMultilineMap, node, true);
                    setIsMultiline(isMultilineMap, node.content, true);
                }
            }
        }
    }
}
