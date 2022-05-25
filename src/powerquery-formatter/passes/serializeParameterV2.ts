// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Trace, TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { CommentCollectionMap, SerializeParameterMapV2, SerializeParameterStateV2 } from "./commonTypes";
import {
    getNodeScopeName,
    ScopeListElement,
    ScopeListElementParameters,
    ScopeMetadata,
    ScopeMetadataProvider,
    StackElement,
} from "../themes";
import { FormatTraceConstant } from "../trace";
import { NodeIdMap } from "@microsoft/powerquery-parser/lib/powerquery-parser/parser";

type RealSerializeParameterStateV2 = SerializeParameterStateV2 & {
    currentScopeStack: StackElement;
    scopeMetadataProvider: ScopeMetadataProvider;
};

export function tryTraverseSerializeParameterV2(
    ast: Ast.TNode,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    commentCollectionMap: CommentCollectionMap,
    scopeMetadataProvider: ScopeMetadataProvider,
    locale: string,
    traceManager: TraceManager,
    maybeCorrelationId: number | undefined,
    maybeCancellationToken: PQP.ICancellationToken | undefined,
): Promise<PQP.Traverse.TriedTraverse<SerializeParameterMapV2>> {
    const trace: Trace = traceManager.entry(
        FormatTraceConstant.SerializeParameterV2,
        tryTraverseSerializeParameterV2.name,
        maybeCorrelationId,
    );

    const defaultMeta: ScopeMetadata = scopeMetadataProvider.getDefaultMetadata();
    const rootScopeName: string = getNodeScopeName(ast);
    const rawRootMeta: ScopeMetadata = scopeMetadataProvider.getMetadataForScope(rootScopeName);

    const rawRootParameter: ScopeListElementParameters = ScopeListElement.mergeParameters(
        defaultMeta,
        undefined,
        rawRootMeta,
    );

    const rootScopeList: ScopeListElement = new ScopeListElement(undefined, rootScopeName, rawRootParameter);
    const rootState: StackElement = new StackElement(undefined, ast, rootScopeList);

    const state: RealSerializeParameterStateV2 = {
        locale,
        traceManager,
        maybeCancellationToken,
        maybeInitialCorrelationId: trace.id,
        commentCollectionMap,
        nodeIdMapCollection,
        currentScopeStack: rootState,
        scopeMetadataProvider,
        result: {
            parametersMap: new Map(),
        },
        workspaceMap: new Map(),
    };

    const result: Promise<PQP.Traverse.TriedTraverse<SerializeParameterMapV2>> = PQP.ResultUtils.ensureResultAsync(
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
    state: RealSerializeParameterStateV2,
    nodeIdMapCollection: NodeIdMap.Collection,
    node: Ast.TNode,
): Promise<void> {
    state.maybeCancellationToken?.throwIfCancelled();
    const currentScopeStack: StackElement = state.currentScopeStack;
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
