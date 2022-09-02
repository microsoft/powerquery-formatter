// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Trace, TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";
import { NodeIdMap } from "@microsoft/powerquery-parser/lib/powerquery-parser/parser";

import {
    CommentCollectionMap,
    SerializeParameter,
    SerializeParameterMap,
    SerializeParameterState,
} from "./commonTypes";
import { getNodeScopeName, ScopeListElement, ScopeMetadata, ScopeMetadataProvider, StackElement } from "../themes";
import { FormatTraceConstant } from "../trace";

type RealSerializeParameterState = SerializeParameterState & {
    currentScopeStack: StackElement<SerializeParameter>;
    scopeMetadataProvider: ScopeMetadataProvider<SerializeParameter>;
};

export function tryTraverseSerializeParameter(
    ast: Ast.TNode,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    commentCollectionMap: CommentCollectionMap,
    scopeMetadataProvider: ScopeMetadataProvider<SerializeParameter>,
    locale: string,
    traceManager: TraceManager,
    correlationId: number | undefined,
    cancellationToken: PQP.ICancellationToken | undefined,
): Promise<PQP.Traverse.TriedTraverse<SerializeParameterMap>> {
    const trace: Trace = traceManager.entry(
        FormatTraceConstant.SerializeParameter,
        tryTraverseSerializeParameter.name,
        correlationId,
    );

    const defaultMeta: ScopeMetadata<SerializeParameter> = scopeMetadataProvider.getDefaultMetadata();
    const rootScopeName: string = getNodeScopeName(ast);
    const rawRootMeta: ScopeMetadata<SerializeParameter> = scopeMetadataProvider.getMetadataForScope(rootScopeName);

    const rawRootParameter: SerializeParameter = ScopeListElement.mergeParameters(
        defaultMeta.themeData?.[0].parameters ?? {},
        undefined,
        rawRootMeta,
    );

    const rootScopeList: ScopeListElement<SerializeParameter> = new ScopeListElement<SerializeParameter>(
        undefined,
        rootScopeName,
        rawRootParameter,
    );

    const rootState: StackElement<SerializeParameter> = new StackElement<SerializeParameter>(
        undefined,
        ast,
        rootScopeList,
    );

    const state: RealSerializeParameterState = {
        locale,
        traceManager,
        cancellationToken,
        initialCorrelationId: trace.id,
        commentCollectionMap,
        nodeIdMapCollection,
        currentScopeStack: rootState,
        scopeMetadataProvider,
        result: {
            parametersMap: new Map(),
        },
    };

    const result: Promise<PQP.Traverse.TriedTraverse<SerializeParameterMap>> = PQP.ResultUtils.ensureResultAsync(
        async () => {
            await doTraverseRecursion(state, nodeIdMapCollection, ast);

            return state.result;
        },
        state.locale,
    );

    trace.exit();

    return result;
}

async function doTraverseRecursion(
    state: RealSerializeParameterState,
    nodeIdMapCollection: NodeIdMap.Collection,
    node: Ast.TNode,
): Promise<void> {
    state.cancellationToken?.throwIfCancelled();
    const currentScopeStack: StackElement<SerializeParameter> = state.currentScopeStack;
    state.result.parametersMap.set(node.id, currentScopeStack.scopeList.parameters);

    for (const child of await PQP.Traverse.assertGetAllAstChildren(state, node, nodeIdMapCollection)) {
        const childScopeName: string = getNodeScopeName(child);

        state.currentScopeStack = state.currentScopeStack.push(
            child,
            childScopeName ? currentScopeStack.scopeList.push(state.scopeMetadataProvider, childScopeName) : undefined,
        );

        // eslint-disable-next-line no-await-in-loop
        await doTraverseRecursion(state, nodeIdMapCollection, child);

        state.currentScopeStack = state.currentScopeStack.pop();
    }
}
