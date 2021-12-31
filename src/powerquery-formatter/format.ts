// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import {
    CommentCollectionMap,
    IsMultilineMap,
    SerializeParameterMap,
    tryTraverseComment,
    tryTraverseSerializeParameter,
} from "./passes";
import {
    IndentationLiteral,
    NewlineLiteral,
    SerializePassthroughMaps,
    SerializeSettings,
    trySerialize,
} from "./serialize";
import { tryTraverseIsMultiline } from "./passes/isMultiline/isMultiline";

export type TriedFormat = PQP.Result<string, TFormatError>;

export type TFormatError =
    | PQP.CommonError.CommonError
    | PQP.Lexer.LexError.TLexError
    | PQP.Parser.ParseError.TParseError;

export interface FormatSettings extends PQP.Settings {
    readonly indentationLiteral: IndentationLiteral;
    readonly newlineLiteral: NewlineLiteral;
}

export const DefaultSettings: FormatSettings = {
    ...PQP.DefaultSettings,
    indentationLiteral: IndentationLiteral.SpaceX4,
    newlineLiteral: NewlineLiteral.Windows,
};

export function tryFormat(formatSettings: FormatSettings, text: string): TriedFormat {
    const triedLexParse: PQP.Task.TriedLexParseTask = PQP.TaskUtils.tryLexParse(formatSettings, text);
    if (PQP.TaskUtils.isError(triedLexParse)) {
        return PQP.ResultUtils.boxError(triedLexParse.error);
    }

    const ast: PQP.Language.Ast.TNode = triedLexParse.ast;
    const comments: ReadonlyArray<PQP.Language.Comment.TComment> = triedLexParse.lexerSnapshot.comments;
    const nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection = triedLexParse.nodeIdMapCollection;
    const locale: string = formatSettings.locale;

    let commentCollectionMap: CommentCollectionMap = new Map();
    if (comments.length) {
        const triedCommentPass: PQP.Traverse.TriedTraverse<CommentCollectionMap> = tryTraverseComment(
            locale,
            ast,
            nodeIdMapCollection,
            comments,
        );

        if (PQP.ResultUtils.isError(triedCommentPass)) {
            return triedCommentPass;
        }
        commentCollectionMap = triedCommentPass.value;
    }

    const triedIsMultilineMap: PQP.Traverse.TriedTraverse<IsMultilineMap> = tryTraverseIsMultiline(
        locale,
        ast,
        commentCollectionMap,
        nodeIdMapCollection,
        formatSettings.traceManager,
    );
    if (PQP.ResultUtils.isError(triedIsMultilineMap)) {
        return triedIsMultilineMap;
    }
    const isMultilineMap: IsMultilineMap = triedIsMultilineMap.value;

    const triedSerializeParameter: PQP.Traverse.TriedTraverse<SerializeParameterMap> = tryTraverseSerializeParameter(
        locale,
        ast,
        nodeIdMapCollection,
        commentCollectionMap,
        isMultilineMap,
        formatSettings.traceManager,
    );
    if (PQP.ResultUtils.isError(triedSerializeParameter)) {
        return triedSerializeParameter;
    }
    const serializeParameterMap: SerializeParameterMap = triedSerializeParameter.value;

    const passthroughMaps: SerializePassthroughMaps = {
        commentCollectionMap,
        serializeParameterMap,
    };
    const serializeRequest: SerializeSettings = {
        locale,
        ast,
        nodeIdMapCollection,
        passthroughMaps,
        indentationLiteral: formatSettings.indentationLiteral,
        traceManager: formatSettings.traceManager,
        newlineLiteral: formatSettings.newlineLiteral,
        maybeCancellationToken: undefined,
    };

    return trySerialize(serializeRequest);
}
