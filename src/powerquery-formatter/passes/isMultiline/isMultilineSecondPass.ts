// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { FormatTraceConstant } from "../../trace";
import { IsMultilineMap, IsMultilineSecondPassState } from "../commonTypes";
import { expectGetIsMultiline, setIsMultiline } from "./common";

export function tryTraverseIsMultilineSecondPass(
    locale: string,
    ast: PQP.Language.Ast.TNode,
    isMultilineMap: IsMultilineMap,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    traceManager: PQP.Trace.TraceManager,
): PQP.Traverse.TriedTraverse<IsMultilineMap> {
    const state: IsMultilineSecondPassState = {
        locale,
        nodeIdMapCollection,
        result: isMultilineMap,
        traceManager,
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

function visitNode(state: IsMultilineSecondPassState, node: PQP.Language.Ast.TNode): void {
    const trace: PQP.Trace.Trace = state.traceManager.entry(FormatTraceConstant.IsMultilinePhase2, visitNode.name, {
        nodeId: node.id,
        nodeKind: node.kind,
    });

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (node.kind) {
        // TBinOpExpression
        case PQP.Language.Ast.NodeKind.ArithmeticExpression:
        case PQP.Language.Ast.NodeKind.AsExpression:
        case PQP.Language.Ast.NodeKind.EqualityExpression:
        case PQP.Language.Ast.NodeKind.IsExpression:
        case PQP.Language.Ast.NodeKind.LogicalExpression:
        case PQP.Language.Ast.NodeKind.RelationalExpression: {
            const isMultilineMap: IsMultilineMap = state.result;
            const maybeParent: PQP.Language.Ast.TNode | undefined = PQP.Parser.NodeIdMapUtils.maybeParentAst(
                state.nodeIdMapCollection,
                node.id,
            );
            if (
                maybeParent &&
                PQP.Language.AstUtils.isTBinOpExpression(maybeParent) &&
                expectGetIsMultiline(isMultilineMap, maybeParent)
            ) {
                trace.trace("Updating isMultiline for nested BinOp");

                setIsMultiline(isMultilineMap, node, true);
            }
            break;
        }

        // If a list or record is a child node,
        // Then by default it should be considered multiline if it has one or more values
        case PQP.Language.Ast.NodeKind.ListExpression:
        case PQP.Language.Ast.NodeKind.ListLiteral:
        case PQP.Language.Ast.NodeKind.RecordExpression:
        case PQP.Language.Ast.NodeKind.RecordLiteral:
            if (node.content.elements.length) {
                trace.trace("Updating isMultiline for collection");

                const nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection = state.nodeIdMapCollection;

                let maybeParent: PQP.Language.Ast.TNode | undefined = PQP.Parser.NodeIdMapUtils.maybeParentAst(
                    nodeIdMapCollection,
                    node.id,
                );
                let maybeCsv: PQP.Language.Ast.TCsv | undefined;
                let maybeArrayWrapper: PQP.Language.Ast.TArrayWrapper | undefined;
                if (maybeParent && maybeParent.kind === PQP.Language.Ast.NodeKind.Csv) {
                    maybeCsv = maybeParent;
                    maybeParent = PQP.Parser.NodeIdMapUtils.maybeParentAst(nodeIdMapCollection, maybeParent.id);
                }
                if (maybeParent && maybeParent.kind === PQP.Language.Ast.NodeKind.ArrayWrapper) {
                    maybeArrayWrapper = maybeParent;
                    maybeParent = PQP.Parser.NodeIdMapUtils.maybeParentAst(nodeIdMapCollection, maybeParent.id);
                }

                if (maybeParent) {
                    const parent: PQP.Language.Ast.TNode = maybeParent;
                    switch (parent.kind) {
                        case PQP.Language.Ast.NodeKind.ItemAccessExpression:
                        case PQP.Language.Ast.NodeKind.InvokeExpression:
                        case PQP.Language.Ast.NodeKind.FunctionExpression:
                        case PQP.Language.Ast.NodeKind.Section:
                        case PQP.Language.Ast.NodeKind.SectionMember:
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

    trace.exit();
}
