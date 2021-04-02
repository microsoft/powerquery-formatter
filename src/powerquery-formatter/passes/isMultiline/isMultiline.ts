// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { CommentCollectionMap, IsMultilineMap } from "../commonTypes";
import { tryTraverseIsMultilineFirstPass } from "./isMultilineFirstPass";
import { tryTraverseIsMultilineSecondPass } from "./isMultilineSecondPass";

// runs a DFS pass followed by a BFS pass.
export function tryTraverseIsMultiline(
    locale: string,
    ast: PQP.Language.Ast.TNode,
    commentCollectionMap: CommentCollectionMap,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
): PQP.Traverse.TriedTraverse<IsMultilineMap> {
    const triedFirstPass: PQP.Traverse.TriedTraverse<IsMultilineMap> = tryTraverseIsMultilineFirstPass(
        locale,
        ast,
        commentCollectionMap,
        nodeIdMapCollection,
    );
    if (PQP.ResultUtils.isError(triedFirstPass)) {
        return triedFirstPass;
    }
    const isMultilineMap: IsMultilineMap = triedFirstPass.value;

    return tryTraverseIsMultilineSecondPass(locale, ast, isMultilineMap, nodeIdMapCollection);
}
