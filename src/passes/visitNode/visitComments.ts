// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { CommentCollection, SerializeCommentParameter, SerializeParameterState, SerializeWriteKind } from "../types";

// serves three purposes:
//  * propagates the TNode's writeKind to the first comment
//  * assigns writeKind for all comments attached to the TNode
//  * conditionally changes the TNode's writeKind based on the last comment's writeKind
//
// for example if maybeWriteKind === PaddedLeft and the TNode has two line comments:
//  * the first comment is set to PaddedLeft (from maybeWriteKind)
//  * the second comment is set to Indented (default for comment with newline)
//  * the TNode is set to Indented (last comment contains a newline)
export function visitComments(
    state: SerializeParameterState,
    node: PQP.Language.Ast.TNode,
    maybeWriteKind: SerializeWriteKind | undefined,
): SerializeWriteKind | undefined {
    const nodeId: number = node.id;
    const maybeComments: CommentCollection | undefined = state.commentCollectionMap.get(nodeId);
    if (!maybeComments) {
        return maybeWriteKind;
    }

    const commentParameters: SerializeCommentParameter[] = [];
    const comments: ReadonlyArray<PQP.Language.TComment> = maybeComments.prefixedComments;

    const numComments: number = comments.length;
    if (!numComments) {
        return maybeWriteKind;
    }

    for (let index: number = 0; index < numComments; index += 1) {
        const comment: PQP.Language.TComment = comments[index];
        const previousComment: PQP.Language.TComment | undefined = comments[index - 1];

        let writeKind: SerializeWriteKind;
        if (index === 0) {
            writeKind = maybeWriteKind || SerializeWriteKind.Any;
        } else if (comment.containsNewline) {
            writeKind = SerializeWriteKind.Indented;
        } else if (previousComment && previousComment.containsNewline) {
            writeKind = SerializeWriteKind.Indented;
        } else {
            writeKind = SerializeWriteKind.Any;
        }

        commentParameters.push({
            literal: comment.data,
            writeKind,
        });
    }

    state.result.comments.set(nodeId, commentParameters);

    const lastComment: PQP.Language.TComment = comments[comments.length - 1];
    if (lastComment.containsNewline) {
        maybeWriteKind = SerializeWriteKind.Indented;
    } else {
        maybeWriteKind = SerializeWriteKind.PaddedLeft;
    }

    return maybeWriteKind;
}
