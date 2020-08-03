// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { CommentCollection, CommentCollectionMap, CommentState } from "./types";

// TODO pass in leafNodeIds instead for a big speed boost.
// Returns a Map<a leaf node's id number, an array of comments attached to the node id>.
export function tryTraverseComment(
    localizationTemplates: PQP.ILocalizationTemplates,
    root: PQP.Language.Ast.TNode,
    nodeIdMapCollection: PQP.NodeIdMap.Collection,
    comments: ReadonlyArray<PQP.Language.TComment>,
): PQP.Traverse.TriedTraverse<CommentCollectionMap> {
    const state: CommentState = {
        localizationTemplates,
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
        PQP.Traverse.expectExpandAllAstChildren,
        earlyExit,
    );
}

function earlyExit(state: CommentState, node: PQP.Language.Ast.TNode): boolean {
    const maybeCurrentComment: PQP.Language.TComment | undefined = state.maybeCurrentComment;
    if (maybeCurrentComment === undefined) {
        return true;
    } else if (node.tokenRange.positionEnd.codeUnit < maybeCurrentComment.positionStart.codeUnit) {
        return true;
    } else {
        return false;
    }
}

function visitNode(state: CommentState, node: PQP.Language.Ast.TNode): void {
    if (!node.isLeaf) {
        return;
    }

    let maybeCurrentComment: PQP.Language.TComment | undefined = state.maybeCurrentComment;
    while (maybeCurrentComment && maybeCurrentComment.positionStart.codeUnit < node.tokenRange.positionStart.codeUnit) {
        const currentComment: PQP.Language.TComment = maybeCurrentComment;
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
