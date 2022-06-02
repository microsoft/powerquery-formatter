// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    EqualityOperator,
    KeywordConstant,
    MiscConstant,
    WrapperConstant,
} from "@microsoft/powerquery-parser/lib/powerquery-parser/language/constant/constant";

import { NodeKind as NK } from "@microsoft/powerquery-parser/lib/powerquery-parser/language/ast/ast";

import { IRawTheme } from "./types";
import { scopeNameFromConstKd } from "./scopeNameHelpers";

export type Offset = "L" | "R";

export type SerializeParameterV2 = Partial<{
    /**
     * container, a boolean field defines whether the current ast node is a container of blocks
     * - a container will persis the indent level unchanged before entering and after leaving it
     */
    container: boolean;
    /**
     * dedentContainerConditionReg, a container field:
     * a regex that will decrease the current indent level by one if the present formatted line matches it
     */
    dedentContainerConditionReg: RegExp;
    /**
     * skipPostContainerNewLine, a container field:
     * once set truthy, it would skip putting a new line when formatter leaving the container
     */
    skipPostContainerNewLine: boolean;
    /**
     * ignoreInline, a container field:
     * once set truthy, it will force the present container being formatted in the block mode when entering it,
     * and ignoreInline is of lower-priority, when a nested container could be fit with the max-width,
     * that nested container could still be formatted in the in-line mode.
     */
    ignoreInline: boolean;
    /**
     * blockOpener, a block field:
     * define an opener anchor relative to the current token, which could be either 'L' or 'R', which starts a block
     * 'L' means the opener is on the left-hand side of the token, and 'R' for the right-hand side
     */
    blockOpener: Offset;
    /**
     * blockOpenerActivatedMatcher, a block field:
     * a regex that would only activate the block opener when it matches the text divided by the current token
     *  when the blockOpener was set 'L', the regex should try to match the text on left-hand side of the token
     *  when the blockOpener was set 'R', the regex should try to match the text on right-hand side of the token
     */
    blockOpenerActivatedMatcher: RegExp;
    /**
     * blockOpener, a block field:
     * define a closer anchor relative to the current token, which could be either 'L' or 'R', which ends the block
     * 'L' means the closer is on the left-hand side of the token, and 'R' for the right-hand side
     */
    blockCloser: Offset;
    /**
     * noWhiteSpaceBetweenWhenNoContentBetweenOpenerAndCloser, a block closer field:
     * wipe out any white spaces only if there were no other tokens between current closer anchor and its opener
     */
    noWhiteSpaceBetweenWhenNoContentBetweenOpenerAndCloser: boolean;
    /**
     * contentDivider, a block field:
     * define a divide anchor relative to the current token, which could be either 'L' or 'R', which would divide tokens
     * 'L' means the closer is on the left-hand side of the token, and 'R' for the right-hand side
     *      In a block mode container, the divider would turn into a new line
     *      In an in-line mode container, the divider should be either a space if it fits or empty instead
     */
    contentDivider: Offset;
    /**
     * leftPadding, a token field:
     * suggest there should be a padding white space on the left-hand side of the token
     */
    leftPadding: boolean;
    /**
     * rightPadding, a token field:
     * suggest there should be a padding white space on the right-hand side of the token
     */
    rightPadding: boolean;
    /**
     * lineBreak, a token field:
     * suggest append a new line on the right-hand side of the token
     */
    lineBreak: Offset;
    /**
     * doubleLineBreak, a token field:
     * suggest append two new lines on the right-hand side of the token
     */
    doubleLineBreak: Offset;
    /**
     * noWhitespaceAppended, a token field:
     * avoid appending any white spaces after the current token before another no-whitespace literal token appended
     */
    noWhitespaceAppended: boolean;
    /**
     * clearTailingWhitespaceBeforeAppending, a token field:
     * clean up any white spaces behind the previously appended non-whitespace literal token
     * and then append the current token
     */
    clearTailingWhitespaceBeforeAppending: boolean;
    /**
     * clearTailingWhitespaceCarriageReturnBeforeAppending, a token field:
     * clean up any white spaces including crlf and lf behind the previously appended non-whitespace literal token
     * and then append the current token
     */
    clearTailingWhitespaceCarriageReturnBeforeAppending: boolean;
}>;

const StatementContainers: ReadonlyArray<NK> = [
    NK.IfExpression,
    NK.EachExpression,
    NK.ErrorHandlingExpression,
    NK.ErrorRaisingExpression,
    NK.FunctionExpression,
    NK.LetExpression,
    NK.OtherwiseExpression,
    NK.ParenthesizedExpression,
    NK.RecordLiteral,
];

const ExpressionContainers: ReadonlyArray<NK> = [
    NK.ArrayWrapper,
    NK.ArithmeticExpression,
    NK.AsExpression,
    NK.MetadataExpression,
    NK.ParameterList,
    NK.IdentifierExpression,
    NK.EqualityExpression,
    NK.LogicalExpression,
    NK.IdentifierPairedExpression,
    NK.GeneralizedIdentifierPairedExpression,
    NK.FieldSpecificationList,
    NK.FieldSpecification,
    NK.RecordExpression,
    NK.ListExpression,
    NK.FieldSelector,
    NK.FieldProjection,
];

export const ContainerSet: ReadonlySet<NK> = new Set<NK>([...StatementContainers, ...ExpressionContainers]);

export const defaultTheme: IRawTheme<SerializeParameterV2> = {
    name: "default",
    settings: [
        // common
        {
            scope: StatementContainers,
            parameters: {
                container: true,
            },
        },
        {
            scope: ExpressionContainers,
            parameters: {
                container: true,
                skipPostContainerNewLine: true,
            },
        },
        {
            scope: ["constant", NK.LiteralExpression, NK.PrimitiveType, NK.GeneralizedIdentifier, NK.Identifier],
            parameters: {
                leftPadding: true,
                rightPadding: true,
            },
        },
        {
            scope: [
                "constant.arithmetic-operator",
                `${scopeNameFromConstKd(KeywordConstant.As)}`,
                `${scopeNameFromConstKd(KeywordConstant.Meta)}`,
            ],
            parameters: {
                leftPadding: true,
                rightPadding: true,
            },
        },
        // list & record blocks
        {
            scope: `${scopeNameFromConstKd(MiscConstant.Comma)}`,
            parameters: {
                rightPadding: true,
                contentDivider: "R",
                clearTailingWhitespaceCarriageReturnBeforeAppending: true,
            },
        },
        {
            scope: [
                `${scopeNameFromConstKd(WrapperConstant.LeftBrace)}`,
                `${scopeNameFromConstKd(WrapperConstant.LeftBracket)}`,
                `${scopeNameFromConstKd(WrapperConstant.LeftParenthesis)}`,
            ],
            parameters: {
                leftPadding: true,
                blockOpener: "R",
                noWhitespaceAppended: true,
            },
        },
        {
            scope: [
                `${scopeNameFromConstKd(WrapperConstant.RightBrace)}`,
                `${scopeNameFromConstKd(WrapperConstant.RightBracket)}`,
                `${scopeNameFromConstKd(WrapperConstant.RightParenthesis)}`,
            ],
            parameters: {
                rightPadding: true,
                blockCloser: "L",
                noWhiteSpaceBetweenWhenNoContentBetweenOpenerAndCloser: true,
                clearTailingWhitespaceBeforeAppending: true,
            },
        },
        // each expressions
        {
            scope: [`${scopeNameFromConstKd(KeywordConstant.Each)}`],
            parameters: {
                blockOpener: "R",
            },
        },
        // if then else blocks
        {
            scope: [NK.IfExpression],
            parameters: {
                container: true,
                dedentContainerConditionReg: /(else)[\s]*$/g,
                ignoreInline: true,
            },
        },
        {
            scope: [`${scopeNameFromConstKd(KeywordConstant.Then)}`],
            parameters: {
                leftPadding: true,
                blockOpener: "R",
            },
        },
        {
            scope: [`${scopeNameFromConstKd(KeywordConstant.Else)}`],
            parameters: {
                blockCloser: "L",
                blockOpener: "R",
            },
        },
        // try otherwise error
        {
            scope: [`${scopeNameFromConstKd(KeywordConstant.Try)}`],
            parameters: {
                leftPadding: true,
                blockOpener: "R",
            },
        },
        {
            scope: [`${scopeNameFromConstKd(KeywordConstant.Otherwise)}`],
            parameters: {
                blockCloser: "L",
                blockOpener: "R",
            },
        },
        {
            scope: [`${scopeNameFromConstKd(KeywordConstant.Error)}`],
            parameters: {
                leftPadding: true,
                blockOpener: "R",
            },
        },
        // function expression
        {
            scope: [`${NK.ParameterList}> ${scopeNameFromConstKd(WrapperConstant.RightParenthesis)}`],
            parameters: {
                blockCloser: "L",
                noWhiteSpaceBetweenWhenNoContentBetweenOpenerAndCloser: true,
                clearTailingWhitespaceBeforeAppending: true,
            },
        },
        {
            scope: [`${scopeNameFromConstKd(MiscConstant.FatArrow)}`],
            parameters: {
                blockOpener: "R",
            },
        },
        // ItemAccessExpression
        {
            scope: [`${NK.ItemAccessExpression}> ${scopeNameFromConstKd(WrapperConstant.LeftBrace)}`],
            parameters: {
                leftPadding: true,
                blockOpener: "R",
                noWhitespaceAppended: true,
                clearTailingWhitespaceCarriageReturnBeforeAppending: true,
            },
        },
        // InvokeExpression
        {
            scope: [`${NK.InvokeExpression}> ${scopeNameFromConstKd(WrapperConstant.LeftParenthesis)}`],
            parameters: {
                leftPadding: true,
                blockOpener: "R",
                noWhitespaceAppended: true,
                clearTailingWhitespaceCarriageReturnBeforeAppending: true,
            },
        },
        // LetExpression
        {
            scope: [NK.LetExpression],
            parameters: {
                container: true,
                ignoreInline: true,
            },
        },
        {
            scope: [`${scopeNameFromConstKd(KeywordConstant.Let)}`],
            parameters: {
                leftPadding: true,
                blockOpener: "R",
            },
        },
        {
            scope: [`${scopeNameFromConstKd(KeywordConstant.In)}`],
            parameters: {
                leftPadding: true,
                blockCloser: "L",
                blockOpener: "R",
            },
        },
        // RangeExpression
        {
            scope: [
                `${NK.RangeExpression}> ${NK.LiteralExpression}`,
                `${NK.RangeExpression}> ${NK.GeneralizedIdentifier}`,
                `${NK.RangeExpression}> ${NK.Identifier}`,
            ],
            parameters: {
                leftPadding: false,
                rightPadding: false,
            },
        },
        {
            scope: [`${NK.RangeExpression}> ${scopeNameFromConstKd(MiscConstant.DotDot)}`],
            parameters: {
                leftPadding: false,
                rightPadding: false,
                clearTailingWhitespaceCarriageReturnBeforeAppending: true,
            },
        },
        // UnaryExpression
        {
            scope: [
                `${NK.UnaryExpression}> ${NK.ArrayWrapper}> constant.arithmetic-operator`,
                `${NK.UnaryExpression}> ${NK.LiteralExpression}`,
            ],
            parameters: {
                contentDivider: undefined,
                leftPadding: false,
                rightPadding: false,
            },
        },
        // IdentifierExpression
        {
            scope: [
                `${NK.IdentifierExpression}> ${scopeNameFromConstKd(MiscConstant.AtSign)}`,
                `${NK.IdentifierExpression}> ${NK.Identifier}`,
            ],
            parameters: {
                contentDivider: undefined,
                leftPadding: false,
                rightPadding: false,
            },
        },
        // Session
        {
            scope: `${scopeNameFromConstKd(MiscConstant.Semicolon)}`,
            parameters: {
                lineBreak: "R",
                rightPadding: true,
                clearTailingWhitespaceCarriageReturnBeforeAppending: true,
            },
        },
        {
            scope: `${NK.Section}> ${scopeNameFromConstKd(MiscConstant.Semicolon)}`,
            parameters: {
                doubleLineBreak: "R",
                rightPadding: true,
                clearTailingWhitespaceCarriageReturnBeforeAppending: true,
            },
        },
        {
            scope: `${NK.Section}> ${NK.ArrayWrapper}> ${NK.SectionMember}> ${scopeNameFromConstKd(
                MiscConstant.Semicolon,
            )}`,
            parameters: {
                lineBreak: "R",
                rightPadding: true,
                clearTailingWhitespaceCarriageReturnBeforeAppending: true,
            },
        },
        {
            scope: [`${NK.Section}> ${NK.RecordLiteral}> ${scopeNameFromConstKd(WrapperConstant.RightBracket)}`],
            parameters: {
                lineBreak: "R",
                clearTailingWhitespaceBeforeAppending: true,
            },
        },
        {
            scope: [`${NK.SectionMember}> ${scopeNameFromConstKd(KeywordConstant.Shared)}`],
            parameters: {
                lineBreak: "L",
            },
        },
        // IdentifierPairedExpression
        {
            scope: [`${NK.IdentifierPairedExpression}> ${scopeNameFromConstKd(EqualityOperator.EqualTo)}`],
            parameters: {
                rightPadding: true,
                blockOpener: "R",
                blockOpenerActivatedMatcher: /^[\s]*(if)/g,
            },
        },
        // FieldSelector & FieldProjection
        {
            scope: [
                `${NK.RecursivePrimaryExpression}> ${NK.FieldSelector}> ${scopeNameFromConstKd(
                    WrapperConstant.LeftBracket,
                )}`,
                `${NK.ArrayWrapper}> ${NK.FieldSelector}> ${scopeNameFromConstKd(WrapperConstant.LeftBracket)}`,
                `${NK.ArrayWrapper}> ${NK.FieldProjection}> ${scopeNameFromConstKd(WrapperConstant.LeftBracket)}`,
            ],
            parameters: {
                blockOpener: "R",
                noWhitespaceAppended: true,
                clearTailingWhitespaceBeforeAppending: true,
            },
        },
        {
            scope: [
                `${NK.FieldSelector}> ${scopeNameFromConstKd(MiscConstant.QuestionMark)}`,
                `${NK.FieldProjection}> ${scopeNameFromConstKd(MiscConstant.QuestionMark)}`,
            ],
            parameters: {
                clearTailingWhitespaceCarriageReturnBeforeAppending: true,
            },
        },
    ],
};
