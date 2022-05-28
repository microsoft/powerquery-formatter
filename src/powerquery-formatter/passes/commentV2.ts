// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";
import { ContainerSet } from "../themes";

import { TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";

import { CommentCollection, CommentCollectionMap, CommentResultV2, CommentStateV2 } from "./commonTypes";

const containerNodeKindSet: ReadonlySet<PQP.Language.Ast.NodeKind> = ContainerSet;

export function tryTraverseCommentV2(
    root: Ast.TNode,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    comments: ReadonlyArray<PQP.Language.Comment.TComment>,
    locale: string,
    traceManager: TraceManager,
    maybeCorrelationId: number | undefined,
    maybeCancellationToken: PQP.ICancellationToken | undefined,
): Promise<PQP.Traverse.TriedTraverse<CommentResultV2>> {
    const state: CommentStateV2 = {
        locale,
        traceManager,
        maybeCancellationToken,
        maybeInitialCorrelationId: maybeCorrelationId,
        result: {
            commentCollectionMap: new Map(),
            containerIdHavingComments: new Set(),
        },
        nodeIdMapCollection,
        comments,
        leafIdsOfItsContainerFound: new Set(),
        commentsIndex: 0,
        maybeCurrentComment: comments[0],
    };

    return PQP.Traverse.tryTraverseAst<CommentStateV2, CommentResultV2>(
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
async function earlyExit(state: CommentStateV2, node: Ast.TNode): Promise<boolean> {
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
async function visitNode(state: CommentStateV2, node: Ast.TNode): Promise<void> {
    if (!node.isLeaf) {
        return;
    }

    const nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection = state.nodeIdMapCollection;
    let maybeCurrentComment: PQP.Language.Comment.TComment | undefined = state.maybeCurrentComment;
    const leafIdsOfItsContainerFound: Set<number> = state.leafIdsOfItsContainerFound;
    const commentMap: CommentCollectionMap = state.result.commentCollectionMap;
    const containerIdHavingComments: Set<number> = state.result.containerIdHavingComments;
    const nodeId: number = node.id;

    while (maybeCurrentComment && maybeCurrentComment.positionStart.codeUnit < node.tokenRange.positionStart.codeUnit) {
        const currentComment: PQP.Language.Comment.TComment = maybeCurrentComment;
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

        // alright we got a leaf node having comments
        if (!leafIdsOfItsContainerFound.has(nodeId)) {
            // trace up to find it the closest ancestry and mark it at containIdsHavingComments
            let maybeParentId: number | undefined = nodeIdMapCollection.parentIdById.get(nodeId);

            while (maybeParentId) {
                const parentId: number = maybeParentId;
                const parent: PQP.Language.Ast.TNode | undefined = nodeIdMapCollection.astNodeById.get(parentId);

                if (parent?.kind && containerNodeKindSet.has(parent?.kind)) {
                    containerIdHavingComments.add(parentId);
                    break;
                }

                maybeParentId = nodeIdMapCollection.parentIdById.get(parentId);
            }
        }

        state.commentsIndex += 1;
        maybeCurrentComment = state.comments[state.commentsIndex];
    }

    state.maybeCurrentComment = maybeCurrentComment;
}
