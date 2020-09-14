// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { FormatError } from ".";
import { CommentCollectionMap, IsMultilineMap, SerializeParameterMap, tryTraverseComment } from "./passes";
import { tryTraverseSerializeParameter } from "./passes";
import { tryTraverseIsMultiline } from "./passes/isMultiline/isMultiline";
import {
    IndentationLiteral,
    NewlineLiteral,
    SerializePassthroughMaps,
    SerializeSettings,
    trySerialize,
} from "./serialize";

export type TriedFormat = PQP.Result<string, FormatError.TFormatError>;

export interface FormatSettings extends PQP.Settings {
    readonly indentationLiteral: IndentationLiteral;
    readonly newlineLiteral: NewlineLiteral;
}

export function tryFormat(formatSettings: FormatSettings, text: string): TriedFormat {
    const triedLexParse: PQP.Task.TriedLexParse = PQP.Task.tryLexParse(
        formatSettings,
        text,
        PQP.Parser.IParserStateUtils.stateFactory,
    );
    if (PQP.ResultUtils.isErr(triedLexParse)) {
        return triedLexParse;
    }

    const lexParseOk: PQP.Task.LexParseOk = triedLexParse.value;
    const root: PQP.Language.Ast.TNode = lexParseOk.root;
    const comments: ReadonlyArray<PQP.Language.Comment.TComment> = lexParseOk.lexerSnapshot.comments;
    const nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection = lexParseOk.state.contextState.nodeIdMapCollection;
    const localizationTemplates: PQP.ILocalizationTemplates = PQP.getLocalizationTemplates(formatSettings.locale);

    let commentCollectionMap: CommentCollectionMap = new Map();
    if (comments.length) {
        const triedCommentPass: PQP.Traverse.TriedTraverse<CommentCollectionMap> = tryTraverseComment(
            localizationTemplates,
            root,
            nodeIdMapCollection,
            comments,
        );

        if (PQP.ResultUtils.isErr(triedCommentPass)) {
            return triedCommentPass;
        }
        commentCollectionMap = triedCommentPass.value;
    }

    const triedIsMultilineMap: PQP.Traverse.TriedTraverse<IsMultilineMap> = tryTraverseIsMultiline(
        localizationTemplates,
        root,
        commentCollectionMap,
        nodeIdMapCollection,
    );
    if (PQP.ResultUtils.isErr(triedIsMultilineMap)) {
        return triedIsMultilineMap;
    }
    const isMultilineMap: IsMultilineMap = triedIsMultilineMap.value;

    const triedSerializeParameter: PQP.Traverse.TriedTraverse<SerializeParameterMap> = tryTraverseSerializeParameter(
        localizationTemplates,
        root,
        nodeIdMapCollection,
        commentCollectionMap,
        isMultilineMap,
    );
    if (PQP.ResultUtils.isErr(triedSerializeParameter)) {
        return triedSerializeParameter;
    }
    const serializeParameterMap: SerializeParameterMap = triedSerializeParameter.value;

    const maps: SerializePassthroughMaps = {
        commentCollectionMap,
        serializeParameterMap,
    };
    const serializeRequest: SerializeSettings = {
        locale: formatSettings.locale,
        root: lexParseOk.root,
        nodeIdMapCollection,
        passthroughMaps: maps,
        indentationLiteral: formatSettings.indentationLiteral,
        newlineLiteral: formatSettings.newlineLiteral,
        maybeCancellationToken: undefined,
    };

    return trySerialize(serializeRequest);
}
