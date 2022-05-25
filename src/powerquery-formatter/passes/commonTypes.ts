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

export interface SerializeParameterMapV2 {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly parametersMap: Map<number, Record<string, any>>;
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
