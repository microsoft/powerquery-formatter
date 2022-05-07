// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Trace, TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { CommentCollectionMap, IsMultilineMap, SerializeParameterMap, SerializeParameterState } from "./commonTypes";
import { FormatTraceConstant } from "../trace";
import { visitNode } from "./visitNode/visitNode";

// TNodes (in general) have two responsibilities:
// * if given a Workspace, then propagate the SerializeWriteKind to their first child,
//   done by calling propagateWriteKind(state, parentNode, childNode)
// * suggest an indentation change and SerializeWriteKind for their children,
//   done by calling setWorkspace(state, childNode, workspace)

export function tryTraverseSerializeParameter(
    locale: string,
    traceManager: TraceManager,
    maybeCorrelationId: number | undefined,
    maybeCancellationToken: PQP.ICancellationToken | undefined,
    ast: Ast.TNode,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    commentCollectionMap: CommentCollectionMap,
    isMultilineMap: IsMultilineMap,
): Promise<PQP.Traverse.TriedTraverse<SerializeParameterMap>> {
    const trace: Trace = traceManager.entry(
        FormatTraceConstant.SerializeParameter,
        tryTraverseSerializeParameter.name,
        maybeCorrelationId,
    );

    const state: SerializeParameterState = {
        locale,
        traceManager,
        maybeCancellationToken,
        maybeInitialCorrelationId: trace.id,
        commentCollectionMap,
        isMultilineMap,
        nodeIdMapCollection,
        result: {
            writeKind: new Map(),
            indentationChange: new Map(),
            comments: new Map(),
        },
        workspaceMap: new Map(),
    };

    const result: Promise<PQP.Traverse.TriedTraverse<SerializeParameterMap>> = PQP.Traverse.tryTraverseAst(
        state,
        nodeIdMapCollection,
        ast,
        PQP.Traverse.VisitNodeStrategy.BreadthFirst,
        visitNode,
        PQP.Traverse.assertGetAllAstChildren,
        undefined,
    );

    trace.exit();

    return result;
}
