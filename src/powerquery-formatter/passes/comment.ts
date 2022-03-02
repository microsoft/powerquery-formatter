// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { CommentCollection, CommentCollectionMap, CommentState } from "./commonTypes";

// TODO pass in leafIds instead for a big speed boost.
// Returns a Map<leafId, an array of comments attached to the leafId>.
export function tryTraverseComment(
    locale: string,
    traceManager: PQP.Trace.TraceManager,
    maybeCancellationToken: PQP.ICancellationToken | undefined,
    root: Ast.TNode,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    comments: ReadonlyArray<PQP.Language.Comment.TComment>,
): Promise<PQP.Traverse.TriedTraverse<CommentCollectionMap>> {
    const state: CommentState = {
        locale,
        traceManager,
        maybeCancellationToken,
        result: new Map(),
        comments,
        commentsIndex: 0,
        maybeCurrentComment: comments[0],
    };

    return PQP.Traverse.tryTraverseAst<CommentState, CommentCollectionMap>(
        state,
        nodeIdMapCollection,
        root,
        PQP.Traverse.VisitNodeStrategy.DepthFirst,
        visitNode,
        PQP.Traverse.assertGetAllAstChildren,
        earlyExit,
    );
}

// eslint-disable-next-line require-await
async function earlyExit(state: CommentState, node: Ast.TNode): Promise<boolean> {
    const maybeCurrentComment: PQP.Language.Comment.TComment | undefined = state.maybeCurrentComment;

    if (maybeCurrentComment === undefined) {
        return true;
    } else if (node.tokenRange.positionEnd.codeUnit < maybeCurrentComment.positionStart.codeUnit) {
        return true;
    } else {
        return false;
    }
}

// eslint-disable-next-line require-await
async function visitNode(state: CommentState, node: Ast.TNode): Promise<void> {
    if (!node.isLeaf) {
        return;
    }

    let maybeCurrentComment: PQP.Language.Comment.TComment | undefined = state.maybeCurrentComment;

    while (maybeCurrentComment && maybeCurrentComment.positionStart.codeUnit < node.tokenRange.positionStart.codeUnit) {
        const currentComment: PQP.Language.Comment.TComment = maybeCurrentComment;
        const commentMap: CommentCollectionMap = state.result;
        const nodeId: number = node.id;
        const maybeCommentCollection: CommentCollection | undefined = commentMap.get(nodeId);

        // It's the first comment for the TNode
        if (maybeCommentCollection === undefined) {
            const commentCollection: CommentCollection = {
                prefixedComments: [currentComment],
                prefixedCommentsContainsNewline: currentComment.containsNewline,
            };

            commentMap.set(nodeId, commentCollection);
        }
        // At least one comment already attached to the TNode
        else {
            const commentCollection: CommentCollection = maybeCommentCollection;
            commentCollection.prefixedComments.push(currentComment);

            if (currentComment.containsNewline) {
                commentCollection.prefixedCommentsContainsNewline = true;
            }
        }

        state.commentsIndex += 1;
        maybeCurrentComment = state.comments[state.commentsIndex];
    }

    state.maybeCurrentComment = maybeCurrentComment;
}
