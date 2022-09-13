// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    EqualityOperator,
    KeywordConstant,
    LogicalOperator,
    MiscConstant,
    WrapperConstant,
} from "@microsoft/powerquery-parser/lib/powerquery-parser/language/constant/constant";
import { NodeKind as NK } from "@microsoft/powerquery-parser/lib/powerquery-parser/language/ast/ast";

import { IRawTheme } from "./types";
import { scopeNameFromConstKd } from "./scopeNameHelpers";
import { SerializeParameter } from "../passes";

const StatementContainers: ReadonlyArray<NK> = [
    NK.IfExpression,
    NK.EachExpression,
    NK.ErrorHandlingExpression,
    NK.ErrorRaisingExpression,
    NK.FunctionExpression,
    NK.LetExpression,
    NK.OtherwiseExpression,
];

const ExpressionContainers: ReadonlyArray<NK> = [
    NK.ParenthesizedExpression,
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
    NK.RecordLiteral,
    NK.FieldSelector,
    NK.FieldProjection,
];

export const ContainerSet: ReadonlySet<NK> = new Set<NK>([...StatementContainers, ...ExpressionContainers]);

export const defaultTheme: IRawTheme<SerializeParameter> = {
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
            scope: [
                `${NK.RecordExpression}> ${NK.ArrayWrapper}`,
                `${NK.RecordLiteral}> ${NK.ArrayWrapper}`,
                `${NK.ListExpression}> ${NK.ArrayWrapper}`,
                `${NK.Csv}> ${NK.RecordExpression}`,
                `${NK.Csv}> ${NK.RecordLiteral}`,
            ],
            parameters: {
                container: true,
                skipPostContainerNewLine: true,
                inheritParentMode: true,
            },
        },
        {
            scope: [`${NK.ArrayWrapper}> ${NK.Csv}`],
            parameters: {
                inheritParentMode: true,
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
            scope: [`${NK.IfExpression}> ${NK.EqualityExpression}`, `${NK.IfExpression}> ${NK.LogicalExpression}`],
            parameters: {
                container: true,
                skipPostContainerNewLine: false,
                contentDivider: "R",
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
                rightPadding: true,
                blockCloser: "L",
                lineBreak: "R",
                noWhiteSpaceBetweenWhenNoContentBetweenOpenerAndCloser: true,
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
                blockOpenerActivatedMatcher: /^[\s]*(if|let|try)/g,
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
        // LogicalExpression & EqualityExpression & ArithmeticExpression
        {
            scope: [`${scopeNameFromConstKd(LogicalOperator.And)}`, `${scopeNameFromConstKd(LogicalOperator.Or)}`],
            parameters: {
                contentDivider: "L",
                leftPadding: true,
                rightPadding: true,
            },
        },
        {
            scope: [`${scopeNameFromConstKd(MiscConstant.Ampersand)}`],
            parameters: {
                blockOpener: "L",
                leftPadding: true,
                rightPadding: true,
            },
        },
        {
            scope: [
                `${NK.LogicalExpression}> ${NK.LogicalExpression}`,
                `${NK.EqualityExpression}> ${NK.LogicalExpression}`,
                `${NK.EqualityExpression}> ${NK.EqualityExpression}`,
                `${NK.LogicalExpression}> ${NK.EqualityExpression}`,
                `${NK.ArithmeticExpression}> ${NK.ArithmeticExpression}`,
            ],
            parameters: {
                container: true,
                skipPostContainerNewLine: true,
                ignoreInline: true,
            },
        },
        {
            scope: [
                `${NK.IdentifierPairedExpression}> ${NK.LogicalExpression}`,
                `${NK.IdentifierPairedExpression}> ${NK.EqualityExpression}`,
                `${NK.IfExpression}> ${NK.LogicalExpression}`,
                `${NK.IfExpression}> ${NK.EqualityExpression}`,
            ],
            parameters: {
                container: true,
                skipPostContainerNewLine: true,
                blockOpener: "L",
            },
        },
    ],
};
