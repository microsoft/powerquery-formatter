// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { CommentCollectionMap, IsMultilineMap, SerializeParameterMap, SerializeParameterState } from "./commonTypes";
import { visitNode } from "./visitNode/visitNode";

// TNodes (in general) have two responsibilities:
// * if given a Workspace, then propagate the SerializeWriteKind to their first child,
//   done by calling propagateWriteKind(state, parentNode, childNode)
// * suggest an indentation change and SerializeWriteKind for their children,
//   done by calling setWorkspace(state, childNode, workspace)

export function tryTraverseSerializeParameter(
    locale: string,
    ast: PQP.Language.Ast.TNode,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    commentCollectionMap: CommentCollectionMap,
    isMultilineMap: IsMultilineMap,
    traceManager: PQP.Trace.TraceManager,
): PQP.Traverse.TriedTraverse<SerializeParameterMap> {
    const state: SerializeParameterState = {
        commentCollectionMap,
        isMultilineMap,
        locale,
        nodeIdMapCollection,
        result: {
            writeKind: new Map(),
            indentationChange: new Map(),
            comments: new Map(),
        },
        traceManager,
        workspaceMap: new Map(),
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
