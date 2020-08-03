// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { CommentCollectionMap, IsMultilineMap, SerializeParameterMap, SerializeParameterState } from "./types";
import { visitNode } from "./visitNode/visitNode";

// TNodes (in general) have two responsibilities:
// * if given a Workspace, then propagate the SerializeWriteKind to their first child,
//   this is done using propagateWriteKind(state, parentNode, childNode)
// * suggest an indentation change and SerializeWriteKind for their children,
//   this is done using setWorkspace(state, childNode, workspace)

export function tryTraverseSerializeParameter(
    localizationTemplates: PQP.ILocalizationTemplates,
    ast: PQP.Language.Ast.TNode,
    nodeIdMapCollection: PQP.NodeIdMap.Collection,
    commentCollectionMap: CommentCollectionMap,
    isMultilineMap: IsMultilineMap,
): PQP.Traverse.TriedTraverse<SerializeParameterMap> {
    const state: SerializeParameterState = {
        result: {
            writeKind: new Map(),
            indentationChange: new Map(),
            comments: new Map(),
        },
        localizationTemplates,
        nodeIdMapCollection,
        commentCollectionMap,
        isMultilineMap,
        workspaceMap: new Map(),
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
