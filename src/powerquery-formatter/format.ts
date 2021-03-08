// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
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
import { ResultUtils } from "@microsoft/powerquery-parser";

export type TriedFormat<S extends PQP.Parser.IParseState = PQP.Parser.IParseState> = PQP.Result<
    string,
    TFormatError<S>
>;

export type TFormatError<S extends PQP.Parser.IParseState = PQP.Parser.IParseState> =
    | PQP.CommonError.CommonError
    | PQP.Lexer.LexError.TLexError
    | PQP.Parser.ParseError.TParseError<S>;

export interface FormatSettings<S extends PQP.Parser.IParseState = PQP.Parser.IParseState> extends PQP.Settings<S> {
    readonly indentationLiteral: IndentationLiteral;
    readonly newlineLiteral: NewlineLiteral;
}

export const DefaultSettings: FormatSettings<PQP.Parser.IParseState> = {
    ...PQP.DefaultSettings,
    indentationLiteral: IndentationLiteral.SpaceX4,
    newlineLiteral: NewlineLiteral.Windows,
};

export function tryFormat<S extends PQP.Parser.IParseState = PQP.Parser.IParseState>(
    formatSettings: FormatSettings<S>,
    text: string,
): TriedFormat<S> {
    const triedLexParse: PQP.Task.TriedLexParseTask<S> = PQP.TaskUtils.tryLexParse(formatSettings, text);
    if (PQP.TaskUtils.isError(triedLexParse)) {
        return ResultUtils.errFactory(triedLexParse.error);
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

        if (PQP.ResultUtils.isErr(triedCommentPass)) {
            return triedCommentPass;
        }
        commentCollectionMap = triedCommentPass.value;
    }

    const triedIsMultilineMap: PQP.Traverse.TriedTraverse<IsMultilineMap> = tryTraverseIsMultiline(
        locale,
        ast,
        commentCollectionMap,
        nodeIdMapCollection,
    );
    if (PQP.ResultUtils.isErr(triedIsMultilineMap)) {
        return triedIsMultilineMap;
    }
    const isMultilineMap: IsMultilineMap = triedIsMultilineMap.value;

    const triedSerializeParameter: PQP.Traverse.TriedTraverse<SerializeParameterMap> = tryTraverseSerializeParameter(
        locale,
        ast,
        nodeIdMapCollection,
        commentCollectionMap,
        isMultilineMap,
    );
    if (PQP.ResultUtils.isErr(triedSerializeParameter)) {
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
        newlineLiteral: formatSettings.newlineLiteral,
        maybeCancellationToken: undefined,
    };

    return trySerialize(serializeRequest);
}
