// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { FormatTraceConstant } from "../../trace";
import { CommentCollectionMap, IsMultilineMap } from "../commonTypes";
import { tryTraverseIsMultilineFirstPass } from "./isMultilineFirstPass";
import { tryTraverseIsMultilineSecondPass } from "./isMultilineSecondPass";

// runs a DFS pass followed by a BFS pass.
export function tryTraverseIsMultiline(
    locale: string,
    ast: PQP.Language.Ast.TNode,
    commentCollectionMap: CommentCollectionMap,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    traceManager: PQP.Trace.TraceManager,
): PQP.Traverse.TriedTraverse<IsMultilineMap> {
    const trace: PQP.Trace.Trace = traceManager.entry(FormatTraceConstant.IsMultiline, tryTraverseIsMultiline.name);

    const triedFirstPass: PQP.Traverse.TriedTraverse<IsMultilineMap> = tryTraverseIsMultilineFirstPass(
        locale,
        ast,
        commentCollectionMap,
        nodeIdMapCollection,
        traceManager,
    );
    if (PQP.ResultUtils.isError(triedFirstPass)) {
        return triedFirstPass;
    }
    const isMultilineMap: IsMultilineMap = triedFirstPass.value;

    const result: PQP.Traverse.TriedTraverse<IsMultilineMap> = tryTraverseIsMultilineSecondPass(
        locale,
        ast,
        isMultilineMap,
        nodeIdMapCollection,
        traceManager,
    );
    trace.exit();

    return result;
}
