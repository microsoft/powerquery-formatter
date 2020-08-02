import * as PQP from "@microsoft/powerquery-parser";

export type IndentationChange = -1 | 1;

export const enum SerializerWriteKind {
    Any = "Any",
    DoubleNewline = "DoubleNewline",
    Indented = "Indented",
    PaddedLeft = "PaddedLeft",
    PaddedRight = "PaddedRight",
}

export interface SerializerParameterMap {
    readonly indentationChange: Map<number, IndentationChange>;
    readonly writeKind: Map<number, SerializerWriteKind>;
    readonly comments: Map<number, ReadonlyArray<SerializeCommentParameter>>;
}

export interface SerializeCommentParameter {
    readonly literal: string;
    readonly writeKind: SerializerWriteKind;
}

export interface SerializeParameterState extends PQP.Traverse.IState<SerializerParameterMap> {
    readonly localizationTemplates: PQP.ILocalizationTemplates;
    readonly nodeIdMapCollection: PQP.NodeIdMap.Collection;
    readonly commentCollectionMap: CommentCollectionMap;
    readonly isMultilineMap: IsMultilineMap;
    readonly workspaceMap: Map<number, TraverseWorkspace>;
}

export interface TraverseWorkspace {
    readonly maybeIndentationChange?: IndentationChange;
    readonly maybeWriteKind?: SerializerWriteKind;
}

export interface CommentState extends PQP.Traverse.IState<CommentCollectionMap> {
    readonly comments: ReadonlyArray<PQP.Language.TComment>;
    commentsIndex: number;
    maybeCurrentComment: PQP.Language.TComment | undefined;
}

export type CommentCollectionMap = Map<number, CommentCollection>;

export interface CommentCollection {
    readonly prefixedComments: PQP.Language.TComment[];
    prefixedCommentsContainsNewline: boolean;
}

export type IsMultilineMap = Map<number, boolean>;
