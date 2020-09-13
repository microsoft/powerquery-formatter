// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import {
    CommentCollectionMap,
    IndentationChange,
    SerializeCommentParameter,
    SerializeParameterMap,
    SerializeWriteKind,
} from "./passes";

export const enum IndentationLiteral {
    SpaceX4 = "    ",
    Tab = "\t",
}

export const enum NewlineLiteral {
    Unix = "\n",
    Windows = "\r\n",
}

export type TriedSerialize = PQP.Result<string, PQP.CommonError.CommonError>;

export interface SerializeSettings extends PQP.CommonSettings {
    readonly root: PQP.Language.Ast.TNode;
    readonly nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection;
    readonly passthroughMaps: SerializePassthroughMaps;
    readonly indentationLiteral: IndentationLiteral;
    readonly newlineLiteral: NewlineLiteral;
}

export interface SerializePassthroughMaps {
    readonly commentCollectionMap: CommentCollectionMap;
    readonly serializeParameterMap: SerializeParameterMap;
}

export function trySerialize(settings: SerializeSettings): TriedSerialize {
    return PQP.ResultUtils.ensureResult(PQP.getLocalizationTemplates(settings.locale), () => serialize(settings));
}

interface SerializeState {
    readonly node: PQP.Language.Ast.TNode;
    readonly nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection;
    readonly passthroughMaps: SerializePassthroughMaps;
    readonly newlineLiteral: NewlineLiteral;
    readonly indentationLiteral: IndentationLiteral;
    readonly indentationCache: string[];
    indentationLevel: number;
    formatted: string;
    currentLine: string;
}

function serialize(settings: SerializeSettings): string {
    const state: SerializeState = stateFromSettings(settings);
    serializeNode(state, state.node);
    return state.formatted;
}

function stateFromSettings(settings: SerializeSettings): SerializeState {
    const state: SerializeState = {
        node: settings.root,
        nodeIdMapCollection: settings.nodeIdMapCollection,
        passthroughMaps: settings.passthroughMaps,
        newlineLiteral: settings.newlineLiteral,
        indentationLiteral: settings.indentationLiteral,
        indentationCache: [""],
        indentationLevel: 0,
        formatted: "",
        currentLine: "",
    };
    expandIndentationCache(state, 10);
    return state;
}

function serializeNode(state: SerializeState, node: PQP.Language.Ast.TNode): void {
    const nodeId: number = node.id;
    const maybeIndentationChange:
        | IndentationChange
        | undefined = state.passthroughMaps.serializeParameterMap.indentationChange.get(nodeId);
    if (maybeIndentationChange) {
        state.indentationLevel += 1;
    }

    if (node.isLeaf) {
        const maybeComments:
            | ReadonlyArray<SerializeCommentParameter>
            | undefined = state.passthroughMaps.serializeParameterMap.comments.get(nodeId);
        if (maybeComments) {
            visitComments(state, maybeComments);
        }
    }

    switch (node.kind) {
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifier:
        case PQP.Language.Ast.NodeKind.Identifier:
        case PQP.Language.Ast.NodeKind.LiteralExpression: {
            const writeKind: SerializeWriteKind = getSerializeWriteKind(
                node,
                state.passthroughMaps.serializeParameterMap,
            );
            serializeLiteral(state, node.literal, writeKind);
            break;
        }

        case PQP.Language.Ast.NodeKind.Constant: {
            const writeKind: SerializeWriteKind = getSerializeWriteKind(
                node,
                state.passthroughMaps.serializeParameterMap,
            );
            serializeLiteral(state, node.constantKind, writeKind);
            break;
        }

        case PQP.Language.Ast.NodeKind.PrimitiveType: {
            const writeKind: SerializeWriteKind = getSerializeWriteKind(
                node,
                state.passthroughMaps.serializeParameterMap,
            );
            serializeLiteral(state, node.primitiveTypeKind, writeKind);
            break;
        }

        default:
            const maybeChildren:
                | ReadonlyArray<PQP.Language.Ast.TNode>
                | undefined = PQP.Parser.NodeIdMapIterator.maybeIterChildrenAst(state.nodeIdMapCollection, node.id);
            if (maybeChildren === undefined) {
                break;
            }
            const children: ReadonlyArray<PQP.Language.Ast.TNode> = maybeChildren;

            for (const child of children) {
                serializeNode(state, child);
            }
    }

    if (maybeIndentationChange) {
        state.indentationLevel -= maybeIndentationChange;
    }
}

function serializeWithPadding(state: SerializeState, str: string, padLeft: boolean, padRight: boolean): void {
    if (padLeft && state.currentLine) {
        const lastWrittenCharacter: string | undefined = state.currentLine[state.currentLine.length - 1];
        if (lastWrittenCharacter !== " " && lastWrittenCharacter !== "\t") {
            appendToFormatted(state, " ");
        }
    }

    appendToFormatted(state, str);

    if (padRight) {
        appendToFormatted(state, " ");
    }
}

function serializeLiteral(state: SerializeState, str: string, serializeWriteKind: SerializeWriteKind): void {
    switch (serializeWriteKind) {
        case SerializeWriteKind.Any:
            appendToFormatted(state, str);
            break;

        case SerializeWriteKind.DoubleNewline:
            appendToFormatted(state, state.newlineLiteral);
            appendToFormatted(state, state.newlineLiteral);
            appendToFormatted(state, str);
            break;

        case SerializeWriteKind.Indented:
            serializeIndented(state, str);
            break;

        case SerializeWriteKind.PaddedLeft:
            serializeWithPadding(state, str, true, false);
            break;

        case SerializeWriteKind.PaddedRight:
            serializeWithPadding(state, str, false, true);
            break;

        default:
            throw PQP.Assert.isNever(serializeWriteKind);
    }
}

function serializeIndented(state: SerializeState, str: string): void {
    if (state.currentLine !== "") {
        appendToFormatted(state, state.newlineLiteral);
    }
    appendToFormatted(state, currentIndentation(state));
    appendToFormatted(state, str);
}

function appendToFormatted(state: SerializeState, str: string): void {
    state.formatted += str;
    if (str === state.newlineLiteral) {
        state.currentLine = "";
    } else {
        state.currentLine += str;
    }
}

function visitComments(state: SerializeState, collection: ReadonlyArray<SerializeCommentParameter>): void {
    for (const comment of collection) {
        serializeLiteral(state, comment.literal, comment.writeKind);
    }
}

function currentIndentation(state: SerializeState): string {
    const maybeIndentationLiteral: string | undefined = state.indentationCache[state.indentationLevel];
    if (maybeIndentationLiteral === undefined) {
        return expandIndentationCache(state, state.indentationLevel);
    } else {
        return maybeIndentationLiteral;
    }
}

function expandIndentationCache(state: SerializeState, level: number): string {
    for (let index: number = state.indentationCache.length; index <= level; index += 1) {
        const previousIndentation: string = state.indentationCache[index - 1] || "";
        state.indentationCache[index] = previousIndentation + state.indentationLiteral;
    }

    return state.indentationCache[state.indentationCache.length - 1];
}

function getSerializeWriteKind(
    node: PQP.Language.Ast.TNode,
    serializeParametersMap: SerializeParameterMap,
): SerializeWriteKind {
    const maybeWriteKind: SerializeWriteKind | undefined = serializeParametersMap.writeKind.get(node.id);
    if (maybeWriteKind) {
        return maybeWriteKind;
    } else {
        const details: {} = { node };
        throw new PQP.CommonError.InvariantError("expected node to be in SerializeParameterMap.writeKind", details);
    }
}
