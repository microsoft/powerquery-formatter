// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Trace, TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import {
    CommentCollection,
    CommentCollectionMap,
    CommentResult,
    SerializeParameterMapV2,
    tryTraverseCommentV2,
    tryTraverseSerializeParameterV2,
} from "./passes";
import {
    IndentationLiteral,
    NewlineLiteral,
    SerializePassthroughMaps,
    SerializeSettings,
    TriedSerialize,
    trySerialize,
} from "./serialize";
import { FormatTraceConstant } from "./trace";
import { SyncThemeRegistry } from "./themes";

export type TriedFormat = PQP.Result<string, TFormatError>;

export type TFormatError =
    | PQP.CommonError.CommonError
    | PQP.Lexer.LexError.TLexError
    | PQP.Parser.ParseError.TParseError;

export interface FormatSettings extends PQP.Settings {
    readonly indentationLiteral: IndentationLiteral;
    readonly newlineLiteral: NewlineLiteral;
    readonly maxWidth?: number;
}

export const DefaultSettings: FormatSettings = {
    ...PQP.DefaultSettings,
    indentationLiteral: IndentationLiteral.SpaceX4,
    newlineLiteral: NewlineLiteral.Windows,
};

export async function tryFormat(formatSettings: FormatSettings, text: string): Promise<TriedFormat> {
    const trace: Trace = formatSettings.traceManager.entry(
        FormatTraceConstant.Format,
        tryFormat.name,
        formatSettings.maybeInitialCorrelationId,
    );

    const triedLexParse: PQP.Task.TriedLexParseTask = await PQP.TaskUtils.tryLexParse(
        {
            ...formatSettings,
            maybeInitialCorrelationId: trace.id,
        },
        text,
    );

    if (PQP.TaskUtils.isError(triedLexParse)) {
        return PQP.ResultUtils.boxError(triedLexParse.error);
    }

    const ast: Ast.TNode = triedLexParse.ast;
    const comments: ReadonlyArray<PQP.Language.Comment.TComment> = triedLexParse.lexerSnapshot.comments;
    const nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection = triedLexParse.nodeIdMapCollection;

    const locale: string = formatSettings.locale;
    const traceManager: TraceManager = formatSettings.traceManager;
    const maybeCancellationToken: PQP.ICancellationToken | undefined = formatSettings.maybeCancellationToken;

    let commentCollectionMap: CommentCollectionMap = new Map();

    let eofCommentCollection: CommentCollection = {
        prefixedComments: [],
        prefixedCommentsContainsNewline: false,
    };

    const containerIdHavingComments: Set<number> = new Set();

    if (comments.length) {
        const triedCommentPass: PQP.Traverse.TriedTraverse<CommentResult> = await tryTraverseCommentV2(
            ast,
            nodeIdMapCollection,
            comments,
            locale,
            traceManager,
            trace.id,
            maybeCancellationToken,
        );

        if (PQP.ResultUtils.isError(triedCommentPass)) {
            return triedCommentPass;
        }

        commentCollectionMap = triedCommentPass.value.commentCollectionMap;
        eofCommentCollection = triedCommentPass.value.eofCommentCollection;

        const containerIdHavingCommentsChildCount: Map<number, number> =
            triedCommentPass.value.containerIdHavingCommentsChildCount;

        const parentContainerIdOfNodeId: Map<number, number> = triedCommentPass.value.parentContainerIdOfNodeId;

        for (const [nodeId, commentCollection] of commentCollectionMap) {
            const isLastCommentContainingNewLine: boolean = commentCollection.prefixedComments.length
                ? commentCollection.prefixedComments[commentCollection.prefixedComments.length - 1].containsNewline
                : false;

            const parentContainerId: number = parentContainerIdOfNodeId.get(nodeId) ?? 0;

            const currentChildIds: ReadonlyArray<number> = parentContainerId
                ? nodeIdMapCollection.childIdsById.get(parentContainerId) ?? []
                : [];

            // if the last comment contained a new line, we definitely gonna append a new line after it
            // therefore, if the current literal token were first child of the closet container,
            // we could render the container in in-line mode
            if (
                isLastCommentContainingNewLine &&
                parentContainerId &&
                currentChildIds.length &&
                currentChildIds[0] === nodeId
            ) {
                // we found one first literal token of matched comments right beneath the container,
                // thus we need to decrease parent's comment child count by one of that container
                let currentChildCount: number = containerIdHavingCommentsChildCount.get(parentContainerId) ?? 1;
                currentChildCount -= 1;
                containerIdHavingCommentsChildCount.set(parentContainerId, currentChildCount);
            }
        }

        // therefore, we only need to populate containerIdHavingComments of child comment greater than zero
        for (const [containerId, childCommentCounts] of containerIdHavingCommentsChildCount) {
            if (childCommentCounts > 0) {
                containerIdHavingComments.add(containerId);
            }
        }
    }

    // move its static as a singleton instant for now
    const newRegistry: SyncThemeRegistry = SyncThemeRegistry.defaultInstance;

    const triedSerializeParameter: PQP.Traverse.TriedTraverse<SerializeParameterMapV2> =
        await tryTraverseSerializeParameterV2(
            ast,
            nodeIdMapCollection,
            commentCollectionMap,
            newRegistry.scopeMetaProvider,
            locale,
            formatSettings.traceManager,
            trace.id,
            maybeCancellationToken,
        );

    if (PQP.ResultUtils.isError(triedSerializeParameter)) {
        return triedSerializeParameter;
    }

    const serializeParameterMap: SerializeParameterMapV2 = triedSerializeParameter.value;

    const passthroughMaps: SerializePassthroughMaps = {
        commentCollectionMap,
        eofCommentCollection,
        containerIdHavingComments,
        serializeParameterMap,
    };

    const serializeRequest: SerializeSettings = {
        locale,
        ast,
        text,
        nodeIdMapCollection,
        passthroughMaps,
        indentationLiteral: formatSettings.indentationLiteral,
        traceManager: formatSettings.traceManager,
        newlineLiteral: formatSettings.newlineLiteral,
        maybeCancellationToken: undefined,
        maybeInitialCorrelationId: trace.id,
        maxWidth: formatSettings.maxWidth,
    };

    const triedSerialize: TriedSerialize = await trySerialize(serializeRequest);
    trace.exit();

    return triedSerialize;
}
