// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Trace, TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";
import { NodeIdMap } from "@microsoft/powerquery-parser/lib/powerquery-parser/parser";

import {
    CommentCollectionMap,
    SerializeParameterMapV2,
    SerializeParameterStateV2,
    SerializeParameterV2,
} from "./commonTypes";
import { getNodeScopeName, ScopeListElement, ScopeMetadata, ScopeMetadataProvider, StackElement } from "../themes";
import { FormatTraceConstant } from "../trace";

type RealSerializeParameterStateV2 = SerializeParameterStateV2 & {
    currentScopeStack: StackElement<SerializeParameterV2>;
    scopeMetadataProvider: ScopeMetadataProvider<SerializeParameterV2>;
};

export function tryTraverseSerializeParameter(
    ast: Ast.TNode,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    commentCollectionMap: CommentCollectionMap,
    scopeMetadataProvider: ScopeMetadataProvider<SerializeParameterV2>,
    locale: string,
    traceManager: TraceManager,
    maybeCorrelationId: number | undefined,
    maybeCancellationToken: PQP.ICancellationToken | undefined,
): Promise<PQP.Traverse.TriedTraverse<SerializeParameterMapV2>> {
    const trace: Trace = traceManager.entry(
        FormatTraceConstant.SerializeParameter,
        tryTraverseSerializeParameter.name,
        maybeCorrelationId,
    );

    const defaultMeta: ScopeMetadata<SerializeParameterV2> = scopeMetadataProvider.getDefaultMetadata();
    const rootScopeName: string = getNodeScopeName(ast);
    const rawRootMeta: ScopeMetadata<SerializeParameterV2> = scopeMetadataProvider.getMetadataForScope(rootScopeName);

    const rawRootParameter: SerializeParameterV2 = ScopeListElement.mergeParameters(
        defaultMeta.themeData?.[0].parameters ?? {},
        undefined,
        rawRootMeta,
    );

    const rootScopeList: ScopeListElement<SerializeParameterV2> = new ScopeListElement<SerializeParameterV2>(
        undefined,
        rootScopeName,
        rawRootParameter,
    );

    const rootState: StackElement<SerializeParameterV2> = new StackElement<SerializeParameterV2>(
        undefined,
        ast,
        rootScopeList,
    );

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
    const currentScopeStack: StackElement<SerializeParameterV2> = state.currentScopeStack;
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
