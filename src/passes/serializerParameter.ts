// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { CommentCollectionMap, IsMultilineMap, SerializeParameterState, SerializerParameterMap } from "./types";
import { visitNode } from "./visitNode/visitNode";

// TNodes (in general) have two responsibilities:
// * if given a Workspace, then propagate the SerializerWriteKind to their first child,
//   this is done using propagateWriteKind(state, parentNode, childNode)
// * suggest an indentation change and SerializerWriteKind for their children,
//   this is done using setWorkspace(state, childNode, workspace)

export function tryTraverseSerializeParameter(
    localizationTemplates: PQP.ILocalizationTemplates,
    ast: PQP.Language.Ast.TNode,
    nodeIdMapCollection: PQP.NodeIdMap.Collection,
    commentCollectionMap: CommentCollectionMap,
    isMultilineMap: IsMultilineMap,
): PQP.Traverse.TriedTraverse<SerializerParameterMap> {
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
