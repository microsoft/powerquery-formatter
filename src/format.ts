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

export type TriedFormat<S extends PQP.Parser.IParserState = PQP.Parser.IParserState> = PQP.Result<
    string,
    FormatError.TFormatError<S>
>;

export interface FormatSettings<S extends PQP.Parser.IParserState = PQP.Parser.IParserState> extends PQP.Settings<S> {
    readonly indentationLiteral: IndentationLiteral;
    readonly newlineLiteral: NewlineLiteral;
}

export const DefaultSettings: FormatSettings<PQP.Parser.IParserState> = {
    ...PQP.DefaultSettings,
    indentationLiteral: IndentationLiteral.SpaceX4,
    newlineLiteral: NewlineLiteral.Windows,
};

export function tryFormat<S extends PQP.Parser.IParserState = PQP.Parser.IParserState>(
    formatSettings: FormatSettings<S>,
    text: string,
): TriedFormat<S> {
    const triedLexParse: PQP.Task.TriedLexParse<S> = PQP.Task.tryLexParse(formatSettings, text);
    if (PQP.ResultUtils.isErr(triedLexParse)) {
        return triedLexParse;
    }

    const lexParseOk: PQP.Task.LexParseOk<S> = triedLexParse.value;
    const root: PQP.Language.Ast.TNode = lexParseOk.root;
    const comments: ReadonlyArray<PQP.Language.Comment.TComment> = lexParseOk.lexerSnapshot.comments;
    const nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection = lexParseOk.state.contextState.nodeIdMapCollection;
    const localizationTemplates: PQP.Templates.ILocalizationTemplates = PQP.LocalizationUtils.getLocalizationTemplates(
        formatSettings.locale,
    );

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

    const passthroughMaps: SerializePassthroughMaps = {
        commentCollectionMap,
        serializeParameterMap,
    };
    const serializeRequest: SerializeSettings = {
        locale: formatSettings.locale,
        root: lexParseOk.root,
        nodeIdMapCollection,
        passthroughMaps,
        indentationLiteral: formatSettings.indentationLiteral,
        newlineLiteral: formatSettings.newlineLiteral,
        maybeCancellationToken: undefined,
    };

    return trySerialize(serializeRequest);
}
