// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Trace, TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { CommentCollectionMap, IsMultilineMap } from "../commonTypes";
import { FormatTraceConstant } from "../../trace";
import { tryTraverseIsMultilineFirstPass } from "./isMultilineFirstPass";
import { tryTraverseIsMultilineSecondPass } from "./isMultilineSecondPass";

// runs a DFS pass followed by a BFS pass.
export async function tryTraverseIsMultiline(
    locale: string,
    traceManager: TraceManager,
    maybeCorrelationId: number | undefined,
    maybeCancellationToken: PQP.ICancellationToken | undefined,
    ast: Ast.TNode,
    commentCollectionMap: CommentCollectionMap,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
): Promise<PQP.Traverse.TriedTraverse<IsMultilineMap>> {
    const trace: Trace = traceManager.entry(
        FormatTraceConstant.IsMultiline,
        tryTraverseIsMultiline.name,
        maybeCorrelationId,
    );

    const triedFirstPass: PQP.Traverse.TriedTraverse<IsMultilineMap> = await tryTraverseIsMultilineFirstPass(
        locale,
        traceManager,
        trace.id,
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
        trace.id,
        maybeCancellationToken,
        ast,
        isMultilineMap,
        nodeIdMapCollection,
    );

    trace.exit();

    return result;
}
