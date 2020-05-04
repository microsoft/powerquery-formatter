// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { FormatError } from ".";
import { CommentCollectionMap, tryTraverseComment } from "./passes/comment";
import { IsMultilineMap } from "./passes/isMultiline/common";
import { tryTraverse as tryTraverseIsMultilineMap } from "./passes/isMultiline/isMultiline";
import { SerializerParameterMap, tryTraverse as tryTraverseSerializerParameter } from "./passes/serializerParameter";
import {
    IndentationLiteral,
    NewlineLiteral,
    SerializerPassthroughMaps,
    SerializerSettings,
    trySerialize,
} from "./serializer";

export type TriedFormat = PQP.Result<string, FormatError.TFormatError>;

export interface FormatSettings extends PQP.Settings {
    readonly indentationLiteral: IndentationLiteral;
    readonly newlineLiteral: NewlineLiteral;
}

export function tryFormat(formatSettings: FormatSettings, text: string): TriedFormat {
    const triedLexParse: PQP.Task.TriedLexParse = PQP.Task.tryLexParse(formatSettings, text);
    if (PQP.ResultUtils.isErr(triedLexParse)) {
        return triedLexParse;
    }

    const lexParseOk: PQP.Task.LexParseOk = triedLexParse.value;
    const ast: PQP.Language.Ast.TDocument = lexParseOk.ast;
    const comments: ReadonlyArray<PQP.Language.TComment> = lexParseOk.lexerSnapshot.comments;
    const nodeIdMapCollection: PQP.NodeIdMap.Collection = lexParseOk.nodeIdMapCollection;
    const localizationTemplates: PQP.ILocalizationTemplates = formatSettings.localizationTemplates;

    let commentCollectionMap: CommentCollectionMap = new Map();
    if (comments.length) {
        const triedCommentPass: PQP.Traverse.TriedTraverse<CommentCollectionMap> = tryTraverseComment(
            localizationTemplates,
            ast,
            nodeIdMapCollection,
            comments,
        );

        if (PQP.ResultUtils.isErr(triedCommentPass)) {
            return triedCommentPass;
        }
        commentCollectionMap = triedCommentPass.value;
    }

    const triedIsMultilineMap: PQP.Traverse.TriedTraverse<IsMultilineMap> = tryTraverseIsMultilineMap(
        localizationTemplates,
        ast,
        commentCollectionMap,
        nodeIdMapCollection,
    );
    if (PQP.ResultUtils.isErr(triedIsMultilineMap)) {
        return triedIsMultilineMap;
    }
    const isMultilineMap: IsMultilineMap = triedIsMultilineMap.value;

    const triedSerializerParameter: PQP.Traverse.TriedTraverse<SerializerParameterMap> = tryTraverseSerializerParameter(
        localizationTemplates,
        ast,
        nodeIdMapCollection,
        commentCollectionMap,
        isMultilineMap,
    );
    if (PQP.ResultUtils.isErr(triedSerializerParameter)) {
        return triedSerializerParameter;
    }
    const serializerParameterMap: SerializerParameterMap = triedSerializerParameter.value;

    const maps: SerializerPassthroughMaps = {
        commentCollectionMap,
        serializerParameterMap,
    };
    const serializeRequest: SerializerSettings = {
        localizationTemplates,
        document: lexParseOk.ast,
        nodeIdMapCollection,
        passthroughMaps: maps,
        indentationLiteral: formatSettings.indentationLiteral,
        newlineLiteral: formatSettings.newlineLiteral,
    };

    return trySerialize(serializeRequest);
}
