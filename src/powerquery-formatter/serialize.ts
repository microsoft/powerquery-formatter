// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";
import { NodeKind } from "@microsoft/powerquery-parser/lib/powerquery-parser/language/ast/ast";

import {
    CommentCollection,
    CommentCollectionMap,
    LinearLengthMap,
    SerializeParameterMap,
    SerializeParameterV2,
} from "./passes";
import { getLinearLength } from "./passes/utils/linearLength";

const ALL_WHITESPACES: RegExp = /^(\s)*$/g;

export interface SerializeSettings extends PQP.CommonSettings {
    readonly ast: Ast.TNode;
    readonly text: string;
    readonly nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection;
    readonly passthroughMaps: SerializePassthroughMaps;
    readonly indentationLiteral: IndentationLiteral;
    readonly newlineLiteral: NewlineLiteral;
    readonly maxWidth?: number;
}

export interface SerializePassthroughMaps {
    readonly commentCollectionMap: CommentCollectionMap;
    readonly eofCommentCollection: CommentCollection;
    readonly containerIdHavingComments: Set<number>;
    readonly serializeParameterMap: SerializeParameterMap;
}

export const enum IndentationLiteral {
    SpaceX4 = "    ",
    Tab = "\t",
}

export const enum NewlineLiteral {
    Unix = "\n",
    Windows = "\r\n",
}

export type TriedSerialize = PQP.Result<string, PQP.CommonError.CommonError>;

export function trySerialize(settings: SerializeSettings): Promise<TriedSerialize> {
    return PQP.ResultUtils.ensureResultAsync(() => serialize(settings), settings.locale);
}

const enum LastTokenType {
    Opener = "Opener",
    Closer = "Closer",
    Divider = "Divider",
    SpanContent = "SpanContent",
    Null = "Null",
    CommentsLine = "CommentsLine",
}

const enum BlockStatus {
    Block = "Block",
    InlineBlock = "InlineBlock",
}

interface SerializeState {
    readonly node: Ast.TNode;
    readonly text: string;
    readonly nodeIdMapCollection: PQP.Parser.NodeIdMap.Collection;
    readonly passthroughMaps: SerializePassthroughMaps;
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
    currentSectionMember: Ast.SectionMember | undefined;
}

async function serialize(settings: SerializeSettings): Promise<string> {
    const state: SerializeState = stateFromSettings(settings);

    let isRootInline: boolean = false;

    if (state.supportInlineBlock) {
        // calc whether we are in line at the entry
        const currentEstLen: number = await getLinearLength(
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
    visitComments(state, settings.passthroughMaps.eofCommentCollection);

    // force cleaning whitespaces and appending crlf to the eof
    state.formatted = cleanUpTailingCrLfOfString(state.formatted);
    state.formatted = cleanUpTailingWhitespacesOrTabsOfString(state.formatted);
    appendToFormatted(state, state.newlineLiteral);

    return state.formatted;
}

function stateFromSettings(settings: SerializeSettings): SerializeState {
    const maxWidth: number = settings.maxWidth ?? -1;
    const supportInlineBlock: boolean = maxWidth > 40;

    // i super wanna turn this file into a class wrapping this state with its utils
    const state: SerializeState = {
        node: settings.ast,
        text: settings.text,
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
        lastTokenType: LastTokenType.Null,
        blockStatusArray: [],
        indentationLevel: 0,
        formatted: "",
        currentLine: "",
        // lexical fields
        isPseudoRightPadding: false,
        isPseudoLine: false,
        isPseudoLineJustCreated: false,
        // syntax fields
        currentSectionMember: undefined,
    };

    expandIndentationCache(state, 10);

    return state;
}

interface InheritOptions {
    readonly isParentInline: boolean;
}

async function serializeNode(state: SerializeState, node: Ast.TNode, inheritOptions: InheritOptions): Promise<void> {
    const nodeId: number = node.id;

    // ad-hoc syntax handling for section members: figure out whether we should put a new line b/w em
    if (node.kind === NodeKind.SectionMember) {
        const currentSectionMemberKeyLiteral: string = node.namePairedExpression.key.literal;
        const currentStaringLineNumber: number = node.tokenRange.positionStart.lineNumber;

        if (state.currentSectionMember) {
            const currentStartingOffset: number = node.tokenRange.positionStart.codeUnit;
            const previousEndingOffset: number = state.currentSectionMember.tokenRange.positionEnd.codeUnit;

            const textBetweenTwoSectionMembers: string = state.text.substring(
                previousEndingOffset,
                currentStartingOffset,
            );

            if (
                // if cx originally put intentional extra white lines b/w section members,
                // we gonna append a new line after it
                (currentStaringLineNumber - state.currentSectionMember.tokenRange.positionEnd.lineNumber > 1 &&
                    countOfLfOnTheEdgeOfTheString(textBetweenTwoSectionMembers) > 1) ||
                shouldBreakAwayFromLastSectionMember(
                    state.currentSectionMember.namePairedExpression.key.literal,
                    currentSectionMemberKeyLiteral,
                )
            ) {
                appendToFormatted(state, state.newlineLiteral);
            }
        }

        state.currentSectionMember = node;
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
        let currentEstLen: number = await getLinearLength(
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
                    leftPadding: parameter.blockOpener === "L",
                    rightPadding: parameter.blockOpener === "R",
                };
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
            state.blockStatusArray.push(BlockStatus.InlineBlock);
        } else {
            state.blockStatusArray.push(BlockStatus.Block);
        }
    }

    // on entering the container
    if (isContainer && !currentlySupportInlineBlock && parameter.indentContainerOnEnter) {
        state.blockStatusArray.push(BlockStatus.Block);
        state.indentationLevel += 1;
    }

    // blockOpener/blockCloser/contentDivider could be an either token parameters or container parameter
    if (parameter.blockOpener === "L" || parameter.blockCloser === "L") {
        let activated: boolean = true;

        if (parameter.blockOpenerActivatedMatcher) {
            activated = shouldActivateAnchorByText(
                state.text.substring(0, node.tokenRange.positionStart.codeUnit),
                parameter.blockOpenerActivatedMatcher,
            );
        }

        if (parameter.blockCloser) {
            const curBlockStatus: BlockStatus | undefined = state.blockStatusArray.pop();

            if (curBlockStatus === BlockStatus.Block) {
                state.indentationLevel -= 1;

                // new line flush out the
                if (
                    state.lastTokenType === LastTokenType.Opener &&
                    state.currentLine === "" &&
                    parameter.noWhiteSpaceBetweenWhenNoContentBetweenOpenerAndCloser
                ) {
                    // mark current line a pseudo-line
                    markCurrentEmptyLinePseudo(state);
                } else if (state.currentLine !== "") {
                    appendToFormatted(state, state.newlineLiteral);
                }
            } else if (curBlockStatus === BlockStatus.InlineBlock && state.lastTokenType === LastTokenType.Opener) {
                wipeOutTailingWhiteSpaces(state);
                // manually regard current line as a pseudo line
                state.isPseudoLineJustCreated = true;
            }

            state.lastTokenType = LastTokenType.Closer;
        } else if (parameter.blockOpener && activated) {
            if (currentlySupportInlineBlock) {
                state.blockStatusArray.push(BlockStatus.InlineBlock);
            } else {
                state.blockStatusArray.push(BlockStatus.Block);
                state.indentationLevel += 1;
            }

            state.lastTokenType = LastTokenType.Opener;

            if (state.currentLine !== "" && !currentlySupportInlineBlock) {
                appendToFormatted(state, state.newlineLiteral);
            }
        }
    } else if (
        parameter.contentDivider === "L" &&
        state.lastTokenType !== LastTokenType.Divider &&
        state.lastTokenType !== LastTokenType.CommentsLine
    ) {
        state.lastTokenType = LastTokenType.Divider;
        const curBlockStatus: BlockStatus | undefined = currentBlockStatus(state);

        if (curBlockStatus === BlockStatus.Block && !endingWithNewline(state)) {
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
                // we need to await in this loop and ensure all ast were visited in sequences other than parallel
                // eslint-disable-next-line no-await-in-loop
                await serializeNode(state, child, { isParentInline: currentlySupportInlineBlock });
            }
        }
    }

    // blockOpener/blockCloser/contentDivider could be an either token parameters or container parameter
    if (parameter.blockOpener === "R" || parameter.blockCloser === "R") {
        let activated: boolean = true;

        if (parameter.blockOpenerActivatedMatcher) {
            activated = shouldActivateAnchorByText(
                state.text.substring(node.tokenRange.positionEnd.codeUnit),
                parameter.blockOpenerActivatedMatcher,
            );
        }

        if (parameter.blockOpener && activated) {
            if (currentlySupportInlineBlock) {
                state.blockStatusArray.push(BlockStatus.InlineBlock);
                state.lastTokenType = LastTokenType.Opener;
            } else {
                state.blockStatusArray.push(BlockStatus.Block);
                state.lastTokenType = LastTokenType.Opener;
                appendToFormatted(state, state.newlineLiteral);
                state.indentationLevel += 1;
            }
        } else if (parameter.blockCloser) {
            const curBlockStatus: BlockStatus | undefined = state.blockStatusArray.pop();

            if (curBlockStatus === BlockStatus.Block) {
                state.indentationLevel -= 1;
                appendToFormatted(state, state.newlineLiteral);
            }

            state.lastTokenType = LastTokenType.Closer;
        }
    } else if (parameter.contentDivider === "R" && state.lastTokenType !== LastTokenType.Divider) {
        state.lastTokenType = LastTokenType.Divider;
        const curBlockStatus: BlockStatus | undefined = currentBlockStatus(state);

        if (curBlockStatus === BlockStatus.Block) {
            appendToFormatted(state, state.newlineLiteral);
        }
    }

    // restore indent level for a container node
    if (isContainer) {
        // false alarm: there should be no race problem since we serialize linearly,
        // we did not promise all at its caller
        state.blockStatusArray = state.blockStatusArray.slice(0, currentBlockStatusArrLen);
        state.indentationLevel = currentIndentLevel;

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
        // let's regard them beneath the adhoc empty string root namespace and should not break with each other
        head = "";
        tail = sectionLiteral;
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
        if (parameter.lineBreak === "L" && !endingWithNewline(state)) {
            appendToFormatted(state, state.newlineLiteral);
        } else if (parameter.doubleLineBreak === "L") {
            if (!endingWithNewline(state)) {
                appendToFormatted(state, state.newlineLiteral);
            }

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
        state.lastTokenType === LastTokenType.Divider &&
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
        state.formatted = cleanUpTailingWhitespacesOrTabsOfString(state.formatted);
    }

    state.formatted += str;

    if (str === state.newlineLiteral) {
        state.currentLine = "";
        // reset the state to a real line
        state.isPseudoLine = false;
    } else {
        state.currentLine += str;
        state.lastTokenType = LastTokenType.SpanContent;
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
                state.lastTokenType = LastTokenType.CommentsLine;
            }
        }
    });
}

function currentBlockStatus(state: SerializeState): BlockStatus | undefined {
    return state.blockStatusArray[state.blockStatusArray.length - 1];
}

function wipeOutTailingWhiteSpaces(state: SerializeState): void {
    state.formatted = cleanUpTailingWhitespacesOrTabsOfString(state.formatted);
    state.currentLine = cleanUpTailingWhitespacesOrTabsOfString(state.currentLine);
}

/**
 * A pseudo line is the line already appended but without crlf at its head
 * markCurrentEmptyLinePseudo can turn the current empty line into a pseudo line
 * @param state
 */
function markCurrentEmptyLinePseudo(state: SerializeState): void {
    if (state.currentLine === "" && state.lastTokenType !== LastTokenType.CommentsLine) {
        // current line is empty and there were no literal appended yet
        // thus just directly remove CRLF and ending /s from the formatted if needed
        state.formatted = cleanUpTailingCrLfOfString(state.formatted);
        state.formatted = cleanUpTailingWhitespacesOrTabsOfString(state.formatted);
        // since the current line has already been empty, no need to remove /s from it

        state.isPseudoLine = true;
        state.isPseudoLineJustCreated = true;
    }
}

function shouldActivateAnchorByText(text: string, matcher: RegExp): boolean {
    return Boolean(text.match(matcher));
}

function maybeDedentContainer(state: SerializeState, parameter: SerializeParameterV2): void {
    if (parameter.dedentContainerConditionReg) {
        const currentFormatted: string = state.formatted + state.formatted;

        if (currentFormatted.match(parameter.dedentContainerConditionReg) && state.currentLine === "") {
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

function endingWithNewline(state: SerializeState): boolean {
    const currentEnding: string = state.formatted.substring(
        state.formatted.length - state.newlineLiteral.length,
        state.formatted.length,
    );

    return currentEnding === state.newlineLiteral && state.currentLine === "";
}

function expandIndentationCache(state: SerializeState, level: number): string {
    for (let index: number = state.indentationCache.length; index <= level; index += 1) {
        const previousIndentation: string = state.indentationCache[index - 1] || "";
        state.indentationCache[index] = previousIndentation + state.indentationLiteral;
    }

    return state.indentationCache[state.indentationCache.length - 1];
}

function cleanUpTailingWhitespacesOrTabsOfString(input: string): string {
    let endingIndex: number = input.length - 1;

    while (input.charAt(endingIndex) === " " || input.charAt(endingIndex) === "\t") {
        endingIndex -= 1;
    }

    if (endingIndex < input.length - 1) {
        return input.slice(0, endingIndex + 1);
    } else {
        return input;
    }
}

function cleanUpTailingCrLfOfString(input: string): string {
    let endingIndex: number = input.length - 1;

    while (input.charAt(endingIndex) === "\r" || input.charAt(endingIndex) === "\n") {
        endingIndex -= 1;
    }

    if (endingIndex < input.length - 1) {
        return input.slice(0, endingIndex + 1);
    } else {
        return input;
    }
}

function countOfLfOnTheEdgeOfTheString(str: string): number {
    let currentIndex: number = 0;
    let totalLfCount: number = 0;

    const isStringAllWhiteSpaces: boolean = Boolean(str.match(ALL_WHITESPACES));

    // calc the count of the LFs beginning at the string
    while ((str.charAt(currentIndex) === "\r" || str.charAt(currentIndex) === "\n") && currentIndex < str.length) {
        if (str.charAt(currentIndex) === "\n") {
            totalLfCount += 1;
        }

        currentIndex += 1;
    }

    // calc the count of the LFs ending at the string if needed
    if (currentIndex < str.length) {
        const lastScannedIndex: number = currentIndex;
        currentIndex = str.length - 1;

        while (
            (str.charAt(currentIndex) === "\r" || str.charAt(currentIndex) === "\n") &&
            currentIndex > lastScannedIndex
        ) {
            if (str.charAt(currentIndex) === "\n") {
                totalLfCount += 1;
            }

            currentIndex -= 1;
        }
    }

    // if there were non-white-space within the string, there definitely be one LF collected for those non-white-space
    // thus we need to minus it by one
    return !isStringAllWhiteSpaces && totalLfCount > 0 ? totalLfCount - 1 : totalLfCount;
}
