// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { CommentCollectionMap } from "./passes/comment";
import {
    getSerializerWriteKind,
    IndentationChange,
    SerializeCommentParameter,
    SerializerParameterMap,
    SerializerWriteKind,
} from "./passes/serializerParameter";

export const enum IndentationLiteral {
    SpaceX4 = "    ",
    Tab = "\t",
}

export const enum NewlineLiteral {
    Unix = "\n",
    Windows = "\r\n",
}

export type TriedSerialize = PQP.Result<string, PQP.CommonError.CommonError>;

export interface SerializerSettings extends PQP.CommonSettings {
    readonly document: PQP.Language.Ast.TDocument;
    readonly nodeIdMapCollection: PQP.NodeIdMap.Collection;
    readonly passthroughMaps: SerializerPassthroughMaps;
    readonly indentationLiteral: IndentationLiteral;
    readonly newlineLiteral: NewlineLiteral;
}

export interface SerializerPassthroughMaps {
    readonly commentCollectionMap: CommentCollectionMap;
    readonly serializerParameterMap: SerializerParameterMap;
}

export function trySerialize(settings: SerializerSettings): TriedSerialize {
    return PQP.ResultUtils.ensureResult(settings.localizationTemplates, () => serialize(settings));
}

interface SerializerState {
    readonly document: PQP.Language.Ast.TDocument;
    readonly nodeIdMapCollection: PQP.NodeIdMap.Collection;
    readonly passthroughMaps: SerializerPassthroughMaps;
    readonly newlineLiteral: NewlineLiteral;
    readonly indentationLiteral: IndentationLiteral;
    readonly indentationCache: string[];
    indentationLevel: number;
    formatted: string;
    currentLine: string;
}

function serialize(settings: SerializerSettings): string {
    const state: SerializerState = stateFromSettings(settings);
    serializeNode(state, state.document);
    return state.formatted;
}

function stateFromSettings(settings: SerializerSettings): SerializerState {
    const state: SerializerState = {
        document: settings.document,
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

function serializeNode(state: SerializerState, node: PQP.Language.Ast.TNode): void {
    const nodeId: number = node.id;
    const maybeIndentationChange:
        | IndentationChange
        | undefined = state.passthroughMaps.serializerParameterMap.indentationChange.get(nodeId);
    if (maybeIndentationChange) {
        state.indentationLevel += 1;
    }

    if (node.isLeaf) {
        const maybeComments:
            | ReadonlyArray<SerializeCommentParameter>
            | undefined = state.passthroughMaps.serializerParameterMap.comments.get(nodeId);
        if (maybeComments) {
            visitComments(state, maybeComments);
        }
    }

    switch (node.kind) {
        case PQP.Language.Ast.NodeKind.Constant: {
            const writeKind: SerializerWriteKind = getSerializerWriteKind(
                node,
                state.passthroughMaps.serializerParameterMap,
            );
            serializeLiteral(state, node.constantKind, writeKind);
            break;
        }

        case PQP.Language.Ast.NodeKind.GeneralizedIdentifier:
        case PQP.Language.Ast.NodeKind.Identifier: {
            const writeKind: SerializerWriteKind = getSerializerWriteKind(
                node,
                state.passthroughMaps.serializerParameterMap,
            );
            serializeLiteral(state, `${node.literal}`, writeKind);
            break;
        }

        case PQP.Language.Ast.NodeKind.LiteralExpression: {
            const writeKind: SerializerWriteKind = getSerializerWriteKind(
                node,
                state.passthroughMaps.serializerParameterMap,
            );
            serializeLiteral(state, node.literal, writeKind);
            break;
        }

        default:
            const maybeChildren:
                | ReadonlyArray<PQP.Language.Ast.TNode>
                | undefined = PQP.NodeIdMapIterator.maybeAstChildren(state.nodeIdMapCollection, node.id);
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

function serializeWithPadding(state: SerializerState, str: string, padLeft: boolean, padRight: boolean): void {
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

function serializeLiteral(state: SerializerState, str: string, serializerWriteKind: SerializerWriteKind): void {
    switch (serializerWriteKind) {
        case SerializerWriteKind.Any:
            appendToFormatted(state, str);
            break;

        case SerializerWriteKind.DoubleNewline:
            appendToFormatted(state, state.newlineLiteral);
            appendToFormatted(state, state.newlineLiteral);
            appendToFormatted(state, str);
            break;

        case SerializerWriteKind.Indented:
            serializeIndented(state, str);
            break;

        case SerializerWriteKind.PaddedLeft:
            serializeWithPadding(state, str, true, false);
            break;

        case SerializerWriteKind.PaddedRight:
            serializeWithPadding(state, str, false, true);
            break;

        default:
            throw PQP.isNever(serializerWriteKind);
    }
}

function serializeIndented(state: SerializerState, str: string): void {
    if (state.currentLine !== "") {
        appendToFormatted(state, state.newlineLiteral);
    }
    appendToFormatted(state, currentIndentation(state));
    appendToFormatted(state, str);
}

function appendToFormatted(state: SerializerState, str: string): void {
    state.formatted += str;
    if (str === state.newlineLiteral) {
        state.currentLine = "";
    } else {
        state.currentLine += str;
    }
}

function visitComments(state: SerializerState, collection: ReadonlyArray<SerializeCommentParameter>): void {
    for (const comment of collection) {
        serializeLiteral(state, comment.literal, comment.writeKind);
    }
}

function currentIndentation(state: SerializerState): string {
    const maybeIndentationLiteral: string | undefined = state.indentationCache[state.indentationLevel];
    if (maybeIndentationLiteral === undefined) {
        return expandIndentationCache(state, state.indentationLevel);
    } else {
        return maybeIndentationLiteral;
    }
}

function expandIndentationCache(state: SerializerState, level: number): string {
    for (let index: number = state.indentationCache.length; index <= level; index += 1) {
        const previousIndentation: string = state.indentationCache[index - 1] || "";
        state.indentationCache[index] = previousIndentation + state.indentationLiteral;
    }

    return state.indentationCache[state.indentationCache.length - 1];
}
