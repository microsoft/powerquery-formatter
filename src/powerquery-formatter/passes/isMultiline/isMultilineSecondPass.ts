// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast, AstUtils } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";
import { Trace, TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";

import { expectGetIsMultiline, setIsMultiline } from "./common";
import { IsMultilineMap, IsMultilineSecondPassState } from "../commonTypes";
import { FormatTraceConstant } from "../../trace";

export function tryTraverseIsMultilineSecondPass(
    locale: string,
    traceManager: TraceManager,
    maybeCorrelationId: number | undefined,
    maybeCancellationToken: PQP.ICancellationToken | undefined,
    ast: Ast.TNode,
    isMultilineMap: IsMultilineMap,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
): Promise<PQP.Traverse.TriedTraverse<IsMultilineMap>> {
    const state: IsMultilineSecondPassState = {
        locale,
        traceManager,
        maybeCancellationToken,
        maybeInitialCorrelationId: maybeCorrelationId,
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
    maybeCorrelationId: number | undefined,
): Promise<void> {
    const trace: Trace = state.traceManager.entry(
        FormatTraceConstant.IsMultilinePhase2,
        visitNode.name,
        maybeCorrelationId,
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

    const maybeParent: Ast.TNode | undefined = PQP.Parser.NodeIdMapUtils.maybeParentAst(
        state.nodeIdMapCollection,
        node.id,
    );

    if (maybeParent && AstUtils.isTBinOpExpression(maybeParent) && expectGetIsMultiline(isMultilineMap, maybeParent)) {
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

        let maybeParent: Ast.TNode | undefined = PQP.Parser.NodeIdMapUtils.maybeParentAst(nodeIdMapCollection, node.id);

        let maybeCsv: Ast.TCsv | undefined;
        let maybeArrayWrapper: Ast.TArrayWrapper | undefined;

        if (maybeParent && maybeParent.kind === Ast.NodeKind.Csv) {
            maybeCsv = maybeParent;
            maybeParent = PQP.Parser.NodeIdMapUtils.maybeParentAst(nodeIdMapCollection, maybeParent.id);
        }

        if (maybeParent && maybeParent.kind === Ast.NodeKind.ArrayWrapper) {
            maybeArrayWrapper = maybeParent;
            maybeParent = PQP.Parser.NodeIdMapUtils.maybeParentAst(nodeIdMapCollection, maybeParent.id);
        }

        if (maybeParent) {
            const parent: Ast.TNode = maybeParent;

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

                    if (maybeCsv) {
                        setIsMultiline(isMultilineMap, maybeCsv, true);
                    }

                    if (maybeArrayWrapper) {
                        setIsMultiline(isMultilineMap, maybeArrayWrapper, true);
                    }

                    setIsMultiline(isMultilineMap, node, true);
                    setIsMultiline(isMultilineMap, node.content, true);
                }
            }
        }
    }
}
