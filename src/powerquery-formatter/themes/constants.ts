import {
    EqualityOperator,
    KeywordConstant,
    MiscConstant,
    WrapperConstant,
} from "@microsoft/powerquery-parser/lib/powerquery-parser/language/constant/constant";

import { constKd2Str } from "./scopeNameHelpers";
import { IRawTheme } from "./types";
import { NodeKind as NK } from "@microsoft/powerquery-parser/lib/powerquery-parser/language/ast/ast";

export type Offset = "L" | "R";

export type SerializeParameterV2 = Partial<{
    container: boolean;
    dedentContainerConditionReg: string;
    skipPostContainerNewLine: boolean;
    ignoreInline: boolean;
    blockOpener: Offset;
    blockCloser: Offset;
    noWhiteSpaceBetweenWhenNoContentBetweenOpenerAndCloser: boolean;
    contentDivider: Offset;
    leftPadding: boolean;
    rightPadding: boolean;
    lineBreak: Offset;
    doubleLineBreak: Offset;
    clearTailingWhitespaceBeforeAppending: boolean;
}>;

export const defaultTheme: IRawTheme<SerializeParameterV2> = {
    name: "default",
    settings: [
        // common
        {
            scope: [
                NK.IfExpression,
                NK.EachExpression,
                NK.ErrorHandlingExpression,
                NK.ErrorRaisingExpression,
                NK.FunctionExpression,
                NK.LetExpression,
                NK.OtherwiseExpression,
                NK.ParenthesizedExpression,
                NK.RecordLiteral,
            ],
            parameters: {
                container: true,
            },
        },
        {
            scope: [
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
            ],
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
                `${constKd2Str(KeywordConstant.As)}`,
                `${constKd2Str(KeywordConstant.Meta)}`,
            ],
            parameters: {
                leftPadding: true,
                rightPadding: true,
                // contentDivider: "L",
            },
        },
        // list & record blocks
        {
            scope: `${constKd2Str(MiscConstant.Comma)}`,
            parameters: {
                rightPadding: true,
                contentDivider: "R",
                clearTailingWhitespaceBeforeAppending: true,
            },
        },
        {
            scope: [
                `${constKd2Str(WrapperConstant.LeftBrace)}`,
                `${constKd2Str(WrapperConstant.LeftBracket)}`,
                `${constKd2Str(WrapperConstant.LeftParenthesis)}`,
            ],
            parameters: {
                leftPadding: true,
                blockOpener: "R",
            },
        },
        {
            scope: [
                `${constKd2Str(WrapperConstant.RightBrace)}`,
                `${constKd2Str(WrapperConstant.RightBracket)}`,
                `${constKd2Str(WrapperConstant.RightParenthesis)}`,
            ],
            parameters: {
                rightPadding: true,
                blockCloser: "L",
                noWhiteSpaceBetweenWhenNoContentBetweenOpenerAndCloser: true,
            },
        },
        // each expressions
        {
            scope: [`${constKd2Str(KeywordConstant.Each)}`],
            parameters: {
                blockOpener: "R",
            },
        },
        // if then else blocks
        {
            scope: [NK.IfExpression],
            parameters: {
                container: true,
                dedentContainerConditionReg: "(?<=else)[\\s]+$",
                ignoreInline: true,
            },
        },
        {
            scope: [`${constKd2Str(KeywordConstant.Then)}`],
            parameters: {
                leftPadding: true,
                blockOpener: "R",
            },
        },
        {
            scope: [`${constKd2Str(KeywordConstant.Else)}`],
            parameters: {
                blockCloser: "L",
                blockOpener: "R",
            },
        },
        // try otherwise error
        {
            scope: [`${constKd2Str(KeywordConstant.Try)}`],
            parameters: {
                leftPadding: true,
                blockOpener: "R",
            },
        },
        {
            scope: [`${constKd2Str(KeywordConstant.Otherwise)}`],
            parameters: {
                blockCloser: "L",
                blockOpener: "R",
            },
        },
        {
            scope: [`${constKd2Str(KeywordConstant.Error)}`],
            parameters: {
                leftPadding: true,
                blockOpener: "R",
            },
        },
        // function expression
        {
            scope: [`${NK.ParameterList}> ${constKd2Str(WrapperConstant.RightParenthesis)}`],
            parameters: {
                blockCloser: "L",
                // contentDivider: "R",
                noWhiteSpaceBetweenWhenNoContentBetweenOpenerAndCloser: true,
            },
        },
        {
            scope: [`${constKd2Str(MiscConstant.FatArrow)}`],
            parameters: {
                // contentDivider: "L",
                blockOpener: "R",
            },
        },
        // ItemAccessExpression
        {
            scope: [`${NK.ItemAccessExpression}> ${constKd2Str(WrapperConstant.LeftBrace)}`],
            parameters: {
                leftPadding: true,
                blockOpener: "R",
                clearTailingWhitespaceBeforeAppending: true,
            },
        },
        // InvokeExpression
        {
            scope: [`${NK.InvokeExpression}> ${constKd2Str(WrapperConstant.LeftParenthesis)}`],
            parameters: {
                leftPadding: true,
                rightPadding: true,
                blockOpener: "R",
                clearTailingWhitespaceBeforeAppending: true,
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
            scope: [`${constKd2Str(KeywordConstant.Let)}`],
            parameters: {
                leftPadding: true,
                blockOpener: "R",
            },
        },
        {
            scope: [`${constKd2Str(KeywordConstant.In)}`],
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
            scope: [`${NK.RangeExpression}> ${constKd2Str(MiscConstant.DotDot)}`],
            parameters: {
                leftPadding: false,
                rightPadding: false,
                clearTailingWhitespaceBeforeAppending: true,
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
                `${NK.IdentifierExpression}> ${constKd2Str(MiscConstant.AtSign)}`,
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
            scope: `${constKd2Str(MiscConstant.Semicolon)}`,
            parameters: {
                lineBreak: "R",
                rightPadding: true,
                clearTailingWhitespaceBeforeAppending: true,
            },
        },
        {
            scope: `${NK.Section}> ${constKd2Str(MiscConstant.Semicolon)}`,
            parameters: {
                doubleLineBreak: "R",
                rightPadding: true,
                clearTailingWhitespaceBeforeAppending: true,
            },
        },
        {
            scope: `${NK.Section}> ${NK.ArrayWrapper}> ${NK.SectionMember}> ${constKd2Str(MiscConstant.Semicolon)}`,
            parameters: {
                lineBreak: "R",
                rightPadding: true,
                clearTailingWhitespaceBeforeAppending: true,
            },
        },
        {
            scope: [`${NK.Section}> ${NK.RecordLiteral}> ${constKd2Str(WrapperConstant.RightBracket)}`],
            parameters: {
                lineBreak: "R",
            },
        },
        {
            scope: [`${NK.SectionMember}> ${constKd2Str(KeywordConstant.Shared)}`],
            parameters: {
                lineBreak: "L",
            },
        },
        // IdentifierPairedExpression
        {
            scope: [`${NK.IdentifierPairedExpression}> ${constKd2Str(EqualityOperator.EqualTo)}`],
            parameters: {
                rightPadding: true,
                blockOpener: "R",
            },
        },
    ],
};
