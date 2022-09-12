// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { Trace, TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { CommentCollectionMap, SerializeParameter, SerializeParameterMap } from "./commonTypes";
import { FormatTraceConstant } from "../trace";
import { getNodeScopeName } from "../themes";
import { NodeKind } from "@microsoft/powerquery-parser/lib/powerquery-parser/language/ast/ast";

interface PreProcessState extends PQP.Traverse.ITraversalState<SerializeParameterMap> {
    readonly nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection;
    readonly commentCollectionMap: CommentCollectionMap;
    readonly cancellationToken: PQP.ICancellationToken | undefined;
    currentNode: Ast.TNode;
    readonly visitedNodes: Ast.TNode[];
    readonly visitedNodeScopeNames: string[];
    readonly result: SerializeParameterMap;
}

type ParameterPreProcessor = (state: PreProcessState) => void;

function parameterizeOneNodeInForceBlockMode(
    currentNode: Ast.TNode,
    serializeParameterMap: Map<number, SerializeParameter>,
): void {
    let nullableCurrentNodeSerializeParameter: SerializeParameter | undefined = serializeParameterMap.get(
        currentNode.id,
    );

    // we need to do immutable modification over here and also need to wrap it in the following preprocessor api
    nullableCurrentNodeSerializeParameter = nullableCurrentNodeSerializeParameter
        ? { ...nullableCurrentNodeSerializeParameter }
        : {};

    nullableCurrentNodeSerializeParameter.forceBlockMode = true;

    serializeParameterMap.set(currentNode.id, nullableCurrentNodeSerializeParameter);
}

// I was thinking, one day, we could expose another preProcessor api to allow other to register other preProcessor, and
// it could help customize more serialization feature which could not be achieved via config-driven patterns
// thus for now, I supposed let's put this, currently only, one preProcessor over here, and
// latter find it a better place when we got those preProcessor registration apis in the following prs
const recordExpressionParameterPreProcessor: ParameterPreProcessor = (state: PreProcessState) => {
    const currentNode: Ast.RecordExpression | Ast.RecordLiteral = state.currentNode as
        | Ast.RecordExpression
        | Ast.RecordLiteral;

    const serializeParameterMap: Map<number, SerializeParameter> = state.result.parametersMap;

    // is current record already in different lines
    let shouldSerializeInMultipleLines: boolean =
        currentNode.openWrapperConstant.tokenRange.positionEnd.lineNumber <
        currentNode.closeWrapperConstant.tokenRange.positionStart.lineNumber;

    // is current record directly owning other records
    shouldSerializeInMultipleLines =
        shouldSerializeInMultipleLines ||
        currentNode.content.elements.some(
            (
                generalizedIdentifierPairedExpressionICsv:
                    | Ast.ICsv<Ast.GeneralizedIdentifierPairedExpression>
                    | Ast.ICsv<Ast.GeneralizedIdentifierPairedAnyLiteral>,
            ): boolean => generalizedIdentifierPairedExpressionICsv.node.value.kind === NodeKind.RecordExpression,
        );

    if (shouldSerializeInMultipleLines) {
        // we got line feeds within the current record we cannot serialize it into the in-line record
        parameterizeOneNodeInForceBlockMode(currentNode, serializeParameterMap);
        parameterizeOneNodeInForceBlockMode(currentNode.content, serializeParameterMap);
    }
};

const preProcessorDictionary: Map<Ast.NodeKind, ReadonlyArray<ParameterPreProcessor>> = new Map([
    [Ast.NodeKind.RecordLiteral, [recordExpressionParameterPreProcessor]],
    [Ast.NodeKind.RecordExpression, [recordExpressionParameterPreProcessor]],
]);

export function tryPreProcessParameter(
    ast: Ast.TNode,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    commentCollectionMap: CommentCollectionMap,
    traceManager: TraceManager,
    locale: string,
    correlationId: number | undefined,
    cancellationToken: PQP.ICancellationToken | undefined,
    serializeParameterMap: SerializeParameterMap,
): Promise<PQP.Traverse.TriedTraverse<SerializeParameterMap>> {
    const trace: Trace = traceManager.entry(
        FormatTraceConstant.PreProcessParameter,
        tryPreProcessParameter.name,
        correlationId,
    );

    const state: PreProcessState = {
        locale,
        traceManager,
        cancellationToken,
        initialCorrelationId: trace.id,
        nodeIdMapCollection,
        commentCollectionMap,
        currentNode: ast,
        visitedNodes: [ast],
        visitedNodeScopeNames: [ast.kind],
        result: serializeParameterMap,
    };

    const result: Promise<PQP.Traverse.TriedTraverse<SerializeParameterMap>> = PQP.ResultUtils.ensureResultAsync(
        async () => {
            if (preProcessorDictionary.size) {
                await doInvokePreProcessor(state);
            }

            return state.result;
        },
        locale,
    );

    trace.exit();

    return result;
}

export async function doInvokePreProcessor(state: PreProcessState): Promise<void> {
    state.cancellationToken?.throwIfCancelled();

    for (const child of await PQP.Traverse.assertGetAllAstChildren(
        state,
        state.currentNode,
        state.nodeIdMapCollection,
    )) {
        const childScopeName: string = getNodeScopeName(child);
        state.currentNode = child;
        state.visitedNodes.push(child);
        state.visitedNodeScopeNames.push(childScopeName);

        // invoke child preProcessor if any
        const nullablePreProcessorArray: ReadonlyArray<ParameterPreProcessor> | undefined = preProcessorDictionary.get(
            child.kind,
        );

        if (Array.isArray(nullablePreProcessorArray)) {
            const preProcessorState: PreProcessState = {
                ...state,
                visitedNodes: state.visitedNodes.slice(),
                visitedNodeScopeNames: state.visitedNodeScopeNames.slice(),
            };

            nullablePreProcessorArray.forEach((preProcessor: ParameterPreProcessor) => {
                preProcessor(preProcessorState);
            });
        }

        // eslint-disable-next-line no-await-in-loop
        await doInvokePreProcessor(state);
        state.visitedNodeScopeNames.pop();
        state.visitedNodes.pop();
    }
}
