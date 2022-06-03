// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Holds all types, enums, and interfaces used by tryTraverseSerializeParameter.

import * as PQP from "@microsoft/powerquery-parser";

export type CommentCollectionMap = Map<number, CommentCollection>;
export type IndentationChange = -1 | 1;
export type IsMultilineMap = Map<number, boolean>;
export type LinearLengthMap = Map<number, number>;

export interface CommentCollection {
    readonly prefixedComments: PQP.Language.Comment.TComment[];
    prefixedCommentsContainsNewline: boolean;
}

export interface CommentState extends PQP.Traverse.ITraversalState<CommentCollectionMap> {
    readonly comments: ReadonlyArray<PQP.Language.Comment.TComment>;
    commentsIndex: number;
    maybeCurrentComment: PQP.Language.Comment.TComment | undefined;
}

export interface IsMultilineFirstPassState extends PQP.Traverse.ITraversalState<IsMultilineMap> {
    readonly commentCollectionMap: CommentCollectionMap;
    readonly linearLengthMap: LinearLengthMap;
    readonly nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection;
}

export interface IsMultilineSecondPassState extends PQP.Traverse.ITraversalState<IsMultilineMap> {
    readonly nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection;
}

export interface LinearLengthState extends PQP.Traverse.ITraversalState<number> {
    readonly linearLengthMap: LinearLengthMap;
    readonly nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection;
}

export const enum SerializeWriteKind {
    Any = "Any",
    DoubleNewline = "DoubleNewline",
    Indented = "Indented",
    PaddedLeft = "PaddedLeft",
    PaddedRight = "PaddedRight",
}

export interface SerializeCommentParameter {
    readonly literal: string;
    readonly writeKind: SerializeWriteKind;
}

export interface SerializeParameter {
    readonly maybeIndentationChange?: IndentationChange;
    readonly maybeWriteKind?: SerializeWriteKind;
}

export interface SerializeParameterMap {
    readonly indentationChange: Map<number, IndentationChange>;
    readonly writeKind: Map<number, SerializeWriteKind>;
    readonly comments: Map<number, ReadonlyArray<SerializeCommentParameter>>;
}

export interface SerializeParameterState extends PQP.Traverse.ITraversalState<SerializeParameterMap> {
    readonly commentCollectionMap: CommentCollectionMap;
    readonly isMultilineMap: IsMultilineMap;
    readonly nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection;
    readonly workspaceMap: Map<number, SerializeParameter>;
}

export interface CommentResultV2 {
    readonly commentCollectionMap: CommentCollectionMap;
    readonly containerIdHavingComments: Set<number>;
}

export interface CommentStateV2 extends PQP.Traverse.ITraversalState<CommentResultV2> {
    readonly nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection;
    readonly comments: ReadonlyArray<PQP.Language.Comment.TComment>;
    /**
     * The leaf ids whose closest container was found already
     */
    readonly leafIdsOfItsContainerFound: Set<number>;
    commentsIndex: number;
    maybeCurrentComment: PQP.Language.Comment.TComment | undefined;
}

export type Offset = "L" | "R";

export type SerializeParameterV2 = Partial<{
    /**
     * container, a boolean field defines whether the current ast node is a container of blocks
     * - a container will persis the indent level unchanged before entering and after leaving it
     */
    container: boolean;
    /**
     * dedentContainerConditionReg, a container field:
     * a regex that will decrease the current indent level by one if the present formatted line matches it
     */
    dedentContainerConditionReg: RegExp;
    /**
     * skipPostContainerNewLine, a container field:
     * once set truthy, it would skip putting a new line when formatter leaving the container
     */
    skipPostContainerNewLine: boolean;
    /**
     * ignoreInline, a container field:
     * once set truthy, it will force the present container being formatted in the block mode when entering it,
     * and ignoreInline is of lower-priority, when a nested container could be fit with the max-width,
     * that nested container could still be formatted in the in-line mode.
     */
    ignoreInline: boolean;
    /**
     * blockOpener, a block or container field:
     * define an opener anchor relative to the current token, which could be either 'L' or 'R', which starts a block
     * 'L' means the opener is on the left-hand side of the token, and 'R' for the right-hand side
     */
    blockOpener: Offset;
    /**
     * blockOpenerActivatedMatcher, a block field:
     * a regex that would only activate the block opener when it matches the text divided by the current token
     *  when the blockOpener was set 'L', the regex should try to match the text on left-hand side of the token
     *  when the blockOpener was set 'R', the regex should try to match the text on right-hand side of the token
     */
    blockOpenerActivatedMatcher: RegExp;
    /**
     * blockOpener, a block or container field:
     * define a closer anchor relative to the current token, which could be either 'L' or 'R', which ends the block
     * 'L' means the closer is on the left-hand side of the token, and 'R' for the right-hand side
     */
    blockCloser: Offset;
    /**
     * noWhiteSpaceBetweenWhenNoContentBetweenOpenerAndCloser, a block closer field:
     * wipe out any white spaces only if there were no other tokens between current closer anchor and its opener
     */
    noWhiteSpaceBetweenWhenNoContentBetweenOpenerAndCloser: boolean;
    /**
     * contentDivider, a block or container field:
     * define a divide anchor relative to the current token, which could be either 'L' or 'R', which would divide tokens
     * 'L' means the closer is on the left-hand side of the token, and 'R' for the right-hand side
     *      In a block mode container, the divider would turn into a new line
     *      In an in-line mode container, the divider should be either a space if it fits or empty instead
     */
    contentDivider: Offset;
    /**
     * leftPadding, a token field:
     * suggest there should be a padding white space on the left-hand side of the token
     */
    leftPadding: boolean;
    /**
     * rightPadding, a token field:
     * suggest there should be a padding white space on the right-hand side of the token
     */
    rightPadding: boolean;
    /**
     * lineBreak, a token field:
     * suggest append a new line on the right-hand side of the token
     */
    lineBreak: Offset;
    /**
     * doubleLineBreak, a token field:
     * suggest append two new lines on the right-hand side of the token
     */
    doubleLineBreak: Offset;
    /**
     * noWhitespaceAppended, a token field:
     * avoid appending any white spaces after the current token before another no-whitespace literal token appended
     */
    noWhitespaceAppended: boolean;
    /**
     * clearTailingWhitespaceBeforeAppending, a token field:
     * clean up any white spaces behind the previously appended non-whitespace literal token
     * and then append the current token
     */
    clearTailingWhitespaceBeforeAppending: boolean;
    /**
     * clearTailingWhitespaceCarriageReturnBeforeAppending, a token field:
     * clean up any white spaces including crlf and lf behind the previously appended non-whitespace literal token
     * and then append the current token
     */
    clearTailingWhitespaceCarriageReturnBeforeAppending: boolean;
}>;

export interface SerializeParameterMapV2 {
    readonly parametersMap: Map<number, SerializeParameterV2>;
}

export interface SerializeParameterStateV2 extends PQP.Traverse.ITraversalState<SerializeParameterMapV2> {
    readonly commentCollectionMap: CommentCollectionMap;
    readonly nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection;
    readonly workspaceMap: Map<number, SerializeParameter>;
}

export const DefaultSerializeParameter: SerializeParameter = {
    maybeWriteKind: SerializeWriteKind.Any,
    maybeIndentationChange: undefined,
};
