// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline, IsMultilineMap, setIsMultiline } from "./common";

export function tryTraverse(
    localizationTemplates: PQP.ILocalizationTemplates,
    ast: PQP.Language.Ast.TNode,
    isMultilineMap: IsMultilineMap,
    nodeIdMapCollection: PQP.NodeIdMap.Collection,
): PQP.Traverse.TriedTraverse<IsMultilineMap> {
    const state: State = {
        localizationTemplates,
        result: isMultilineMap,
        nodeIdMapCollection,
    };

    return PQP.Traverse.tryTraverseAst(
        state,
        nodeIdMapCollection,
        ast,
        PQP.Traverse.VisitNodeStrategy.BreadthFirst,
        visitNode,
        PQP.Traverse.expectExpandAllAstChildren,
        undefined,
    );
}

interface State extends PQP.Traverse.IState<IsMultilineMap> {
    readonly nodeIdMapCollection: PQP.NodeIdMap.Collection;
}

function visitNode(state: State, node: PQP.Language.Ast.TNode): void {
    // tslint:disable-next-line: switch-default
    switch (node.kind) {
        // TBinOpExpression
        case PQP.Language.Ast.NodeKind.ArithmeticExpression:
        case PQP.Language.Ast.NodeKind.AsExpression:
        case PQP.Language.Ast.NodeKind.EqualityExpression:
        case PQP.Language.Ast.NodeKind.IsExpression:
        case PQP.Language.Ast.NodeKind.LogicalExpression:
        case PQP.Language.Ast.NodeKind.RelationalExpression: {
            const isMultilineMap: IsMultilineMap = state.result;
            const maybeParent: PQP.Language.Ast.TNode | undefined = PQP.NodeIdMapUtils.maybeParentAstNode(
                state.nodeIdMapCollection,
                node.id,
            );
            if (
                maybeParent &&
                PQP.Language.AstUtils.isTBinOpExpression(maybeParent) &&
                expectGetIsMultiline(isMultilineMap, maybeParent)
            ) {
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
                const nodeIdMapCollection: PQP.NodeIdMap.Collection = state.nodeIdMapCollection;

                let maybeParent: PQP.Language.Ast.TNode | undefined = PQP.NodeIdMapUtils.maybeParentAstNode(
                    nodeIdMapCollection,
                    node.id,
                );
                let maybeCsv: PQP.Language.Ast.TCsv | undefined;
                let maybeArrayWrapper: PQP.Language.Ast.TArrayWrapper | undefined;
                if (maybeParent && maybeParent.kind === PQP.Language.Ast.NodeKind.Csv) {
                    maybeCsv = maybeParent;
                    maybeParent = PQP.NodeIdMapUtils.maybeParentAstNode(nodeIdMapCollection, maybeParent.id);
                }
                if (maybeParent && maybeParent.kind === PQP.Language.Ast.NodeKind.ArrayWrapper) {
                    maybeArrayWrapper = maybeParent;
                    maybeParent = PQP.NodeIdMapUtils.maybeParentAstNode(nodeIdMapCollection, maybeParent.id);
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
}
