// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { CommentCollectionMap, IsMultilineMap } from "../commonTypes";
import { FormatTraceConstant } from "../../trace";
import { tryTraverseIsMultilineFirstPass } from "./isMultilineFirstPass";
import { tryTraverseIsMultilineSecondPass } from "./isMultilineSecondPass";

// runs a DFS pass followed by a BFS pass.
export async function tryTraverseIsMultiline(
    locale: string,
    traceManager: PQP.Trace.TraceManager,
    maybeCancellationToken: PQP.ICancellationToken | undefined,
    ast: PQP.Language.Ast.TNode,
    commentCollectionMap: CommentCollectionMap,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
): Promise<PQP.Traverse.TriedTraverse<IsMultilineMap>> {
    const trace: PQP.Trace.Trace = traceManager.entry(FormatTraceConstant.IsMultiline, tryTraverseIsMultiline.name);

    const triedFirstPass: PQP.Traverse.TriedTraverse<IsMultilineMap> = await tryTraverseIsMultilineFirstPass(
        locale,
        traceManager,
        maybeCancellationToken,
        ast,
        commentCollectionMap,
        nodeIdMapCollection,
    );
    if (PQP.ResultUtils.isError(triedFirstPass)) {
        return triedFirstPass;
    }
    const isMultilineMap: IsMultilineMap = triedFirstPass.value;

    const result: PQP.Traverse.TriedTraverse<IsMultilineMap> = await tryTraverseIsMultilineSecondPass(
        locale,
        traceManager,
        maybeCancellationToken,
        ast,
        isMultilineMap,
        nodeIdMapCollection,
    );
    trace.exit();

    return result;
}
