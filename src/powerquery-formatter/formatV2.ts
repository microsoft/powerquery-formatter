// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Trace, TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import {
    CommentCollectionMap,
    CommentResultV2,
    SerializeParameterMapV2,
    tryTraverseCommentV2,
    tryTraverseSerializeParameterV2,
} from "./passes";
import { FormatSettings, TriedFormat } from "./format";
import { SerializePassthroughMapsV2, SerializeSettingsV2, trySerializeV2 } from "./serializeV2";

import { FormatTraceConstant } from "./trace";
import { SyncThemeRegistry } from "./themes";
import { TriedSerialize } from "./serialize";

export async function tryFormatV2(formatSettings: FormatSettings, text: string): Promise<TriedFormat> {
    const trace: Trace = formatSettings.traceManager.entry(
        FormatTraceConstant.FormatV2,
        tryFormatV2.name,
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
    let containerIdHavingComments: Set<number> = new Set();

    if (comments.length) {
        const triedCommentPass: PQP.Traverse.TriedTraverse<CommentResultV2> = await tryTraverseCommentV2(
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
        containerIdHavingComments = triedCommentPass.value.containerIdHavingComments;
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

    const passthroughMaps: SerializePassthroughMapsV2 = {
        commentCollectionMap,
        containerIdHavingComments,
        serializeParameterMap,
    };

    const serializeRequest: SerializeSettingsV2 = {
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

    const triedSerialize: TriedSerialize = await trySerializeV2(serializeRequest);
    trace.exit();

    return triedSerialize;
}
