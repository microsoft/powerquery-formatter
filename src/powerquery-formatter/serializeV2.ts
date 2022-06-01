// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { SerializeParameterV2 } from "./themes";

import { CommentCollection, CommentCollectionMap, LinearLengthMap, SerializeParameterMapV2 } from "./passes";
import { IndentationLiteral, NewlineLiteral, TriedSerialize } from "./serialize";
import { getLinearLengthV2 } from "./passes/utils/linearLengthV2";
import { NodeKind } from "@microsoft/powerquery-parser/lib/powerquery-parser/language/ast/ast";

// const GLOBAL_HEADING_WHITE_SPACE_REG: RegExp = /^[ \t]+/g;
const GLOBAL_TAILING_WHITE_SPACE_REG: RegExp = /[ \t]+$/g;
const GLOBAL_TAILING_CRLF_REG: RegExp = /(\r\n|\n\r|\r|\n)*$/g;

export interface SerializeSettingsV2 extends PQP.CommonSettings {
    readonly ast: Ast.TNode;
    readonly nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection;
    readonly passthroughMaps: SerializePassthroughMapsV2;
    readonly indentationLiteral: IndentationLiteral;
    readonly newlineLiteral: NewlineLiteral;
    readonly maxWidth?: number;
}

export interface SerializePassthroughMapsV2 {
    readonly commentCollectionMap: CommentCollectionMap;
    readonly containerIdHavingComments: Set<number>;
    readonly serializeParameterMap: SerializeParameterMapV2;
}

export function trySerializeV2(settings: SerializeSettingsV2): Promise<TriedSerialize> {
    return PQP.ResultUtils.ensureResultAsync(() => serializeV2(settings), settings.locale);
}

type LastTokenType = "Opener" | "Closer" | "Divider" | "SpanContent" | "Null" | "CommentsLine";
type BlockStatus = "Block" | "InlineBlock";

interface SerializeState {
    readonly node: Ast.TNode;
    readonly nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection;
    readonly passthroughMaps: SerializePassthroughMapsV2;
    readonly locale: string;
    readonly traceManager: PQP.Trace.TraceManager;
    readonly maybeInitialCorrelationId: number | undefined;
    readonly linearLengthMap: LinearLengthMap;
    readonly newlineLiteral: NewlineLiteral;
    readonly indentationLiteral: IndentationLiteral;
    readonly maybeCancellationToken: PQP.ICancellationToken | undefined;
    readonly indentationCache: string[];
    readonly maxWidth: number;
    readonly supportInlineBlock: boolean;
    lastTokenType: LastTokenType;
    blockStatusArray: BlockStatus[];
    indentationLevel: number;
    formatted: string;
    currentLine: string;
    // lexical fields
    isPseudoRightPadding: boolean;
    isPseudoLine: boolean;
    isPseudoLineJustCreated: boolean;
    // syntax fields
    currentSectionMemberKeyLiteral: string;
}

async function serializeV2(settings: SerializeSettingsV2): Promise<string> {
    const state: SerializeState = stateFromSettings(settings);

    let isRootInline: boolean = false;

    if (state.supportInlineBlock) {
        // calc whether we are in line at the entry
        const currentEstLen: number = await getLinearLengthV2(
            state.nodeIdMapCollection,
            state.linearLengthMap,
            state.node,
            state.locale,
            state.traceManager,
            state.maybeInitialCorrelationId,
            state.maybeCancellationToken,
        );

        if (isFinite(currentEstLen)) {
            isRootInline = currentEstLen < state.maxWidth;
        }
    }

    // eslint-disable-next-line @typescript-eslint/await-thenable
    await serializeNode(state, state.node, { isParentInline: isRootInline });

    // force cleaning whitespaces and appending crlf to the eof
    state.formatted = state.formatted.replace(GLOBAL_TAILING_CRLF_REG, "");
    state.formatted = state.formatted.replace(GLOBAL_TAILING_WHITE_SPACE_REG, "");
    appendToFormatted(state, state.newlineLiteral);

    return state.formatted;
}

function stateFromSettings(settings: SerializeSettingsV2): SerializeState {
    const maxWidth: number = settings.maxWidth ?? -1;
    const supportInlineBlock: boolean = maxWidth > 40;

    // i super wanna turn this file into a class wrapping this state with its utils
    const state: SerializeState = {
        node: settings.ast,
        nodeIdMapCollection: settings.nodeIdMapCollection,
        passthroughMaps: settings.passthroughMaps,
        locale: settings.locale,
        traceManager: settings.traceManager,
        maybeInitialCorrelationId: settings.maybeInitialCorrelationId,
        maybeCancellationToken: settings.maybeCancellationToken,
        linearLengthMap: new Map(),
        newlineLiteral: settings.newlineLiteral,
        indentationLiteral: settings.indentationLiteral,
        indentationCache: [""],
        maxWidth,
        supportInlineBlock,
        lastTokenType: "Null",
        blockStatusArray: [],
        indentationLevel: 0,
        formatted: "",
        currentLine: "",
        // lexical fields
        isPseudoRightPadding: false,
        isPseudoLine: false,
        isPseudoLineJustCreated: false,
        // syntax fields
        currentSectionMemberKeyLiteral: "",
    };

    expandIndentationCache(state, 10);

    return state;
}

interface InheritOptions {
    isParentInline: boolean;
}

async function serializeNode(state: SerializeState, node: Ast.TNode, inheritOptions: InheritOptions): Promise<void> {
    const nodeId: number = node.id;

    // ad-hoc syntax handling for section members starting with the same namespace name
    if (node.kind === NodeKind.SectionMember) {
        const currentSectionMemberKeyLiteral: string = node.namePairedExpression.key.literal;

        if (
            state.currentSectionMemberKeyLiteral &&
            shouldBreakAwayFromLastSectionMember(state.currentSectionMemberKeyLiteral, currentSectionMemberKeyLiteral)
        ) {
            appendToFormatted(state, state.newlineLiteral);
        }

        state.currentSectionMemberKeyLiteral = currentSectionMemberKeyLiteral;
    }

    let parameter: SerializeParameterV2 = state.passthroughMaps.serializeParameterMap.parametersMap.get(nodeId) ?? {};
    const directlyHavingComments: boolean = state.passthroughMaps.containerIdHavingComments.has(nodeId);

    const isContainer: boolean = Boolean(parameter.container);

    // maybe dedent before saving current indent level
    if (isContainer) {
        maybeDedentContainer(state, parameter);
    }

    const currentIndentLevel: number = state.indentationLevel;
    const currentBlockStatusArrLen: number = state.blockStatusArray.length;
    let currentlySupportInlineBlock: boolean = inheritOptions.isParentInline && !directlyHavingComments;

    if (
        state.supportInlineBlock &&
        isContainer &&
        !directlyHavingComments &&
        parameter.ignoreInline !== true &&
        !currentlySupportInlineBlock
    ) {
        // we are a block opener and also could support inline-block, thus calc the line to check it fits or not
        let currentEstLen: number = await getLinearLengthV2(
            state.nodeIdMapCollection,
            state.linearLengthMap,
            node,
            state.locale,
            state.traceManager,
            state.maybeInitialCorrelationId,
            state.maybeCancellationToken,
        );

        if (isFinite(currentEstLen)) {
            if (state.currentLine === "") {
                currentEstLen += currentIndentation(state).length;
            } else {
                currentEstLen += state.currentLine.length;
            }

            currentlySupportInlineBlock = currentEstLen < state.maxWidth;

            if (currentlySupportInlineBlock) {
                parameter = {
                    ...parameter,
                };

                if (parameter.blockOpener === "R") {
                    parameter.rightPadding = true;
                }

                if (parameter.blockOpener === "L") {
                    parameter.leftPadding = true;
                }
            }
        }
    }

    if (node.isLeaf) {
        const maybeComments: CommentCollection | undefined = state.passthroughMaps.commentCollectionMap.get(nodeId);

        if (maybeComments) {
            visitComments(state, maybeComments);
        }
    }

    if (isContainer && !parameter.blockOpener) {
        // do not touch the indent for a default container block opener
        // and the pushed container block status would be wiped when we exist the container
        if (currentlySupportInlineBlock) {
            state.blockStatusArray.push("InlineBlock");
        } else {
            state.blockStatusArray.push("Block");
        }
    } else if (parameter.blockOpener === "L" || parameter.blockCloser === "L") {
        if (parameter.blockCloser) {
            const curBlockStatus: BlockStatus | undefined = state.blockStatusArray.pop();

            if (curBlockStatus === "Block") {
                state.indentationLevel -= 1;

                // new line flush out the
                if (
                    state.lastTokenType === "Opener" &&
                    state.currentLine === "" &&
                    parameter.noWhiteSpaceBetweenWhenNoContentBetweenOpenerAndCloser
                ) {
                    // mark current line a pseudo-line
                    markCurrentEmptyLinePseudo(state);
                } else if (state.currentLine !== "") {
                    appendToFormatted(state, state.newlineLiteral);
                }
            } else if (curBlockStatus === "InlineBlock" && state.lastTokenType === "Opener") {
                wipeOutTailingWhiteSpaces(state);
                // manually regard current line as a pseudo line
                state.isPseudoLineJustCreated = true;
            }

            state.lastTokenType = "Closer";
        } else if (parameter.blockOpener) {
            // eslint-disable-next-line require-atomic-updates
            state.lastTokenType = "Opener";

            if (currentlySupportInlineBlock) {
                state.blockStatusArray.push("InlineBlock");
            } else {
                state.blockStatusArray.push("Block");
                state.indentationLevel += 1;
            }

            if (state.currentLine !== "" && !currentlySupportInlineBlock) {
                appendToFormatted(state, state.newlineLiteral);
            }
        }
    } else if (parameter.contentDivider === "L" && state.lastTokenType !== "Divider") {
        // eslint-disable-next-line require-atomic-updates
        state.lastTokenType = "Divider";
        const curBlockStatus: BlockStatus | undefined = currentBlockStatus(state);

        if (curBlockStatus === "Block") {
            appendToFormatted(state, state.newlineLiteral);
        }
    }

    switch (node.kind) {
        case Ast.NodeKind.GeneralizedIdentifier:
        case Ast.NodeKind.Identifier:
        case Ast.NodeKind.LiteralExpression:
            visitIdentifierOrLiteral(state, node, parameter);
            break;

        case Ast.NodeKind.Constant: {
            serializeLiteral(state, node.constantKind, parameter);
            break;
        }

        case Ast.NodeKind.PrimitiveType: {
            serializeLiteral(state, node.primitiveTypeKind, parameter);
            break;
        }

        default: {
            const maybeChildren: ReadonlyArray<Ast.TNode> | undefined =
                PQP.Parser.NodeIdMapIterator.maybeIterChildrenAst(state.nodeIdMapCollection, node.id);

            if (maybeChildren === undefined) {
                break;
            }

            for (const child of maybeChildren) {
                // eslint-disable-next-line no-await-in-loop
                await serializeNode(state, child, { isParentInline: currentlySupportInlineBlock });
            }
        }
    }

    if (parameter.blockOpener === "R" || parameter.blockCloser === "R") {
        if (parameter.blockOpener) {
            // eslint-disable-next-line require-atomic-updates
            state.lastTokenType = "Opener";

            if (currentlySupportInlineBlock) {
                state.blockStatusArray.push("InlineBlock");
            } else {
                state.blockStatusArray.push("Block");
                appendToFormatted(state, state.newlineLiteral);
                state.indentationLevel += 1;
            }
        } else if (parameter.blockCloser) {
            const curBlockStatus: BlockStatus | undefined = state.blockStatusArray.pop();

            if (curBlockStatus === "Block") {
                state.indentationLevel -= 1;
                appendToFormatted(state, state.newlineLiteral);
            }

            state.lastTokenType = "Closer";
        }
    } else if (parameter.contentDivider === "R" && state.lastTokenType !== "Divider") {
        // eslint-disable-next-line require-atomic-updates
        state.lastTokenType = "Divider";
        const curBlockStatus: BlockStatus | undefined = currentBlockStatus(state);

        if (curBlockStatus === "Block") {
            appendToFormatted(state, state.newlineLiteral);
        }
    }

    // restore indent level for a container node
    if (isContainer) {
        // false alarm: there should be no race problem since we serialize linearly,
        // we did not promise all at its caller
        // eslint-disable-next-line require-atomic-updates
        state.indentationLevel = currentIndentLevel;
        state.blockStatusArray = state.blockStatusArray.slice(0, currentBlockStatusArrLen);

        if (!currentlySupportInlineBlock && state.currentLine !== "" && parameter.skipPostContainerNewLine !== true) {
            appendToFormatted(state, state.newlineLiteral);
        }
    }
}

function getSectionMemberLiteralTailPair(sectionLiteral: string): [string, string] {
    const dotIndex: number = sectionLiteral.indexOf(".");
    let head: string;
    let tail: string;

    if (dotIndex === -1) {
        head = sectionLiteral;
        tail = "";
    } else {
        head = sectionLiteral.substring(0, dotIndex);
        tail = sectionLiteral.substring(dotIndex + 1);
    }

    return [head, tail];
}

function shouldBreakAwayFromLastSectionMember(lastSectionLiteral: string, currentSectionLiteral: string): boolean {
    const [lastHead]: [string, string] = getSectionMemberLiteralTailPair(lastSectionLiteral);
    const [curHead]: [string, string] = getSectionMemberLiteralTailPair(currentSectionLiteral);

    return lastHead !== curHead;
}

function visitIdentifierOrLiteral(
    state: SerializeState,
    node: Ast.GeneralizedIdentifier | Ast.Identifier | Ast.LiteralExpression,
    parameter: SerializeParameterV2,
): void {
    serializeLiteral(state, node.literal, parameter);
}

function serializeLiteral(state: SerializeState, str: string, parameter: SerializeParameterV2): void {
    if (parameter.clearTailingWhitespaceCarriageReturnBeforeAppending) {
        if (state.currentLine) {
            // new literal was appended to the formatted and currentLine together, thus we have to modify them together
            wipeOutTailingWhiteSpaces(state);
        } else {
            // clean up crlf by turning current empty line into a pseudo line
            markCurrentEmptyLinePseudo(state);
        }
    } else if (parameter.clearTailingWhitespaceBeforeAppending) {
        if (state.currentLine) {
            wipeOutTailingWhiteSpaces(state);
        }
    } else if (parameter.lineBreak || parameter.doubleLineBreak) {
        if (parameter.lineBreak === "L") {
            appendToFormatted(state, state.newlineLiteral);
        } else if (parameter.doubleLineBreak === "L") {
            appendToFormatted(state, state.newlineLiteral);
            appendToFormatted(state, state.newlineLiteral);
        }
    } else if (parameter.leftPadding && state.currentLine) {
        const lastWrittenCharacter: string | undefined = state.currentLine[state.currentLine.length - 1];

        // do not create duplicated leftPadding or step on just-created pseudo-line
        if (lastWrittenCharacter !== " " && lastWrittenCharacter !== "\t" && !state.isPseudoLineJustCreated) {
            appendToFormatted(state, " ");
        }
    }

    if (
        state.supportInlineBlock &&
        state.lastTokenType === "Divider" &&
        state.currentLine.length + str.length + 1 > state.maxWidth &&
        currentIndentation(state).length + str.length + 1 <= state.maxWidth
    ) {
        appendToFormatted(state, state.newlineLiteral);
    }

    maybePopulateIndented(state);
    appendToFormatted(state, str);

    if (parameter.lineBreak || parameter.doubleLineBreak) {
        if (parameter.lineBreak === "R") {
            appendToFormatted(state, state.newlineLiteral);
        } else if (parameter.doubleLineBreak === "R") {
            appendToFormatted(state, state.newlineLiteral);
            appendToFormatted(state, state.newlineLiteral);
        }
    } else if (parameter.noWhitespaceAppended) {
        state.isPseudoRightPadding = true;
    } else if (parameter.rightPadding) {
        appendToFormatted(state, " ");
    }
}

function maybePopulateIndented(state: SerializeState): void {
    if (state.currentLine === "" && !state.isPseudoLine) {
        appendToFormatted(state, currentIndentation(state));
    }
}

function appendToFormatted(state: SerializeState, str: string): void {
    if (state.isPseudoRightPadding && str === " ") {
        return;
    }

    state.isPseudoRightPadding = false;

    // do not pollute any tailing characters of the line before a just created pseudo-line
    if (str === state.newlineLiteral && !state.isPseudoLineJustCreated) {
        // remove any tailing whitespace or \t from the formatted
        state.formatted = state.formatted.replace(GLOBAL_TAILING_WHITE_SPACE_REG, "");
    }

    state.formatted += str;

    if (str === state.newlineLiteral) {
        state.currentLine = "";
        // reset the state to a real line
        state.isPseudoLine = false;
    } else {
        state.currentLine += str;
        state.lastTokenType = "SpanContent";
        state.isPseudoLineJustCreated = false;
    }
}

function visitComments(state: SerializeState, collection: CommentCollection): void {
    collection.prefixedComments.forEach((comment: PQP.Language.Comment.TComment, index: number) => {
        if (index === 0) {
            if (state.currentLine !== "" && comment.containsNewline) {
                appendToFormatted(state, state.newlineLiteral);
            }

            serializeLiteral(state, comment.data, { rightPadding: !comment.containsNewline });
        } else {
            const lastComment: PQP.Language.Comment.TComment = collection.prefixedComments[index - 1];

            if (lastComment.containsNewline) {
                appendToFormatted(state, state.newlineLiteral);
            } else {
                appendToFormatted(state, " ");
            }

            serializeLiteral(state, comment.data, { rightPadding: !comment.containsNewline });
        }

        if (index === collection.prefixedComments.length - 1) {
            if (comment.containsNewline) {
                appendToFormatted(state, state.newlineLiteral);
                state.lastTokenType = "CommentsLine";
            }
        }
    });
}

function currentBlockStatus(state: SerializeState): BlockStatus | undefined {
    return state.blockStatusArray[state.blockStatusArray.length - 1];
}

function wipeOutTailingWhiteSpaces(state: SerializeState): void {
    state.formatted = state.formatted.replace(GLOBAL_TAILING_WHITE_SPACE_REG, "");
    state.currentLine = state.currentLine.replace(GLOBAL_TAILING_WHITE_SPACE_REG, "");
}

/**
 * A pseudo line is the line already appended but without crlf at its head
 * markCurrentEmptyLinePseudo can turn the current empty line into a pseudo line
 * @param state
 */
function markCurrentEmptyLinePseudo(state: SerializeState): void {
    if (state.currentLine === "" && state.lastTokenType !== "CommentsLine") {
        // current line is empty and there were no literal appended yet
        // thus just directly remove CRLF and ending /s from the formatted if needed
        state.formatted = state.formatted.replace(GLOBAL_TAILING_CRLF_REG, "");

        state.formatted = state.formatted.replace(GLOBAL_TAILING_WHITE_SPACE_REG, "");
        // since the current line has already been empty, no need to remove /s from it

        state.isPseudoLine = true;
        state.isPseudoLineJustCreated = true;
    }
}

function maybeDedentContainer(state: SerializeState, parameter: SerializeParameterV2): void {
    if (parameter.dedentContainerConditionReg) {
        const currentFormatted: string = state.formatted + state.formatted;
        // for now this regex was from internal, thus it is safe to create it
        // eslint-disable-next-line security/detect-non-literal-regexp
        const conditionReg: RegExp = new RegExp(parameter.dedentContainerConditionReg);

        if (currentFormatted.match(conditionReg) && state.currentLine === "") {
            markCurrentEmptyLinePseudo(state);
            state.indentationLevel -= 1;
            appendToFormatted(state, " ");
        }
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
