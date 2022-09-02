// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";
import { TraceManager } from "@microsoft/powerquery-parser/lib/powerquery-parser/common/trace";

import { CommentCollection, CommentCollectionMap, CommentResult, CommentState } from "./commonTypes";
import { ContainerSet } from "../themes";

const containerNodeKindSet: ReadonlySet<PQP.Language.Ast.NodeKind> = ContainerSet;

export async function tryTraverseCommentV2(
    root: Ast.TNode,
    nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection,
    comments: ReadonlyArray<PQP.Language.Comment.TComment>,
    locale: string,
    traceManager: TraceManager,
    maybeCorrelationId: number | undefined,
    maybeCancellationToken: PQP.ICancellationToken | undefined,
): Promise<PQP.Traverse.TriedTraverse<CommentResult>> {
    const state: CommentState = {
        locale,
        traceManager,
        maybeCancellationToken,
        maybeInitialCorrelationId: maybeCorrelationId,
        result: {
            commentCollectionMap: new Map(),
            containerIdHavingCommentsChildCount: new Map(),
            parentContainerIdOfNodeId: new Map(),
            eofCommentCollection: {
                prefixedComments: [],
                prefixedCommentsContainsNewline: false,
            },
        },
        nodeIdMapCollection,
        comments,
        leafIdsOfItsContainerFound: new Set(),
        commentsIndex: 0,
        maybeCurrentComment: comments[0],
    };

    const triedCommentPass: PQP.Traverse.TriedTraverse<CommentResult> = await PQP.Traverse.tryTraverseAst<
        CommentState,
        CommentResult
    >(
        state,
        nodeIdMapCollection,
        root,
        PQP.Traverse.VisitNodeStrategy.DepthFirst,
        visitNode,
        PQP.Traverse.assertGetAllAstChildren,
        earlyExit,
    );

    // check whether we got any comment prefixed to the EOF
    if (!PQP.ResultUtils.isError(triedCommentPass) && state.commentsIndex < state.comments.length) {
        const result: CommentResult = triedCommentPass.value;
        let prefixedCommentsContainsNewline: boolean = false;
        result.eofCommentCollection.prefixedComments.length = 0;

        state.comments
            .slice(state.commentsIndex, state.comments.length)
            .forEach((comment: PQP.Language.Comment.TComment) => {
                result.eofCommentCollection.prefixedComments.push(comment);
                prefixedCommentsContainsNewline = prefixedCommentsContainsNewline || comment.containsNewline;
            });

        result.eofCommentCollection.prefixedCommentsContainsNewline = prefixedCommentsContainsNewline;
    }

    return triedCommentPass;
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

    const nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection = state.nodeIdMapCollection;
    let maybeCurrentComment: PQP.Language.Comment.TComment | undefined = state.maybeCurrentComment;
    const leafIdsOfItsContainerFound: Set<number> = state.leafIdsOfItsContainerFound;
    const commentMap: CommentCollectionMap = state.result.commentCollectionMap;
    const containerIdHavingCommentsChildCount: Map<number, number> = state.result.containerIdHavingCommentsChildCount;
    const parentContainerIdOfNodeId: Map<number, number> = state.result.parentContainerIdOfNodeId;
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
                    let currentChildCount: number = containerIdHavingCommentsChildCount.get(parentId) ?? 0;
                    currentChildCount += 1;
                    containerIdHavingCommentsChildCount.set(parentId, currentChildCount);
                    parentContainerIdOfNodeId.set(nodeId, parentId);
                    leafIdsOfItsContainerFound.add(nodeId);
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
