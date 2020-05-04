// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { CommentCollectionMap } from "../comment";
import { IsMultilineMap } from "./common";
import { tryTraverse as tryTraverseFirstPass } from "./isMultilineFirstPass";
import { tryTraverse as tryTraverseSecondPass } from "./isMultilineSecondPass";

// runs a DFS pass followed by a BFS pass.
export function tryTraverse(
    localizationTemplates: PQP.ILocalizationTemplates,
    ast: PQP.Language.Ast.TDocument,
    commentCollectionMap: CommentCollectionMap,
    nodeIdMapCollection: PQP.NodeIdMap.Collection,
): PQP.Traverse.TriedTraverse<IsMultilineMap> {
    const triedFirstPass: PQP.Traverse.TriedTraverse<IsMultilineMap> = tryTraverseFirstPass(
        localizationTemplates,
        ast,
        commentCollectionMap,
        nodeIdMapCollection,
    );
    if (PQP.ResultUtils.isErr(triedFirstPass)) {
        return triedFirstPass;
    }
    const isMultilineMap: IsMultilineMap = triedFirstPass.value;

    return tryTraverseSecondPass(localizationTemplates, ast, isMultilineMap, nodeIdMapCollection);
}
