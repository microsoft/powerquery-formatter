// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
    ArithmeticOperator,
    EqualityOperator,
    KeywordConstant,
    LanguageConstant,
    LogicalOperator,
    MiscConstant,
    PrimitiveTypeConstant,
    RelationalOperator,
    TConstant,
    UnaryOperator,
    WrapperConstant,
} from "@microsoft/powerquery-parser/lib/powerquery-parser/language/constant/constant";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

export function constKd2Str(constantKind: TConstant): string {
    switch (constantKind) {
        case ArithmeticOperator.Multiplication:
            return "constant.arithmetic-operator.multiplication";
        case ArithmeticOperator.Division:
            return "constant.arithmetic-operator.division";
        case ArithmeticOperator.Addition:
            return "constant.arithmetic-operator.addition";
        case ArithmeticOperator.Subtraction:
            return "constant.arithmetic-operator.subtraction";
        case ArithmeticOperator.And:
            return "constant.arithmetic-operator.and";
        case EqualityOperator.EqualTo:
            return "constant.equality-operator.equal-to";
        case EqualityOperator.NotEqualTo:
            return "constant.equality-operator.not-equal-to";
        case KeywordConstant.As:
            return "constant.keyword.as";
        case KeywordConstant.Each:
            return "constant.keyword.each";
        case KeywordConstant.Else:
            return "constant.keyword.else";
        case KeywordConstant.Error:
            return "constant.keyword.error";
        case KeywordConstant.False:
            return "constant.keyword.false";
        case KeywordConstant.If:
            return "constant.keyword.if";
        case KeywordConstant.In:
            return "constant.keyword.in";
        case KeywordConstant.Is:
            return "constant.keyword.is";
        case KeywordConstant.Let:
            return "constant.keyword.let";
        case KeywordConstant.Meta:
            return "constant.keyword.meta";
        case KeywordConstant.Otherwise:
            return "constant.keyword.otherwise";
        case KeywordConstant.Section:
            return "constant.keyword.section";
        case KeywordConstant.Shared:
            return "constant.keyword.shared";
        case KeywordConstant.Then:
            return "constant.keyword.then";
        case KeywordConstant.True:
            return "constant.keyword.true";
        case KeywordConstant.Try:
            return "constant.keyword.try";
        case KeywordConstant.Type:
            return "constant.keyword.type";
        case LanguageConstant.Nullable:
            return "constant.language.nullable";
        case LanguageConstant.Optional:
            return "constant.language.optional";
        case LogicalOperator.And:
            return "constant.language.and";
        case LogicalOperator.Or:
            return "constant.language.or";
        case MiscConstant.Ampersand:
            return "constant.misc.ampersand";
        case MiscConstant.AtSign:
            return "constant.misc.at-sign";
        case MiscConstant.Comma:
            return "constant.misc.coma";
        case MiscConstant.DotDot:
            return "constant.misc.dot-dot";
        case MiscConstant.Ellipsis:
            return "constant.misc.ellipsis";
        case MiscConstant.Equal:
            return "constant.misc.equal";
        case MiscConstant.FatArrow:
            return "constant.misc.fat-arrow";
        case MiscConstant.NullCoalescingOperator:
            return "constant.misc.null-coalescing-operator";
        case MiscConstant.Semicolon:
            return "constant.misc.semicolon";
        case MiscConstant.QuestionMark:
            return "constant.misc.question-mark";
        case PrimitiveTypeConstant.Action:
            return "constant.primitive-type.action";
        case PrimitiveTypeConstant.Any:
            return "constant.primitive-type.any";
        case PrimitiveTypeConstant.AnyNonNull:
            return "constant.primitive-type.any-not-null";
        case PrimitiveTypeConstant.Binary:
            return "constant.primitive-type.binary";
        case PrimitiveTypeConstant.Date:
            return "constant.primitive-type.date";
        case PrimitiveTypeConstant.DateTime:
            return "constant.primitive-type.date-time";
        case PrimitiveTypeConstant.DateTimeZone:
            return "constant.primitive-type.date-time-zone";
        case PrimitiveTypeConstant.Duration:
            return "constant.primitive-type.duration";
        case PrimitiveTypeConstant.Function:
            return "constant.primitive-type.function";
        case PrimitiveTypeConstant.List:
            return "constant.primitive-type.list";
        case PrimitiveTypeConstant.Logical:
            return "constant.primitive-type.logical";
        case PrimitiveTypeConstant.None:
            return "constant.primitive-type.none";
        case PrimitiveTypeConstant.Null:
            return "constant.primitive-type.null";
        case PrimitiveTypeConstant.Number:
            return "constant.primitive-type.number";
        case PrimitiveTypeConstant.Record:
            return "constant.primitive-type.record";
        case PrimitiveTypeConstant.Table:
            return "constant.primitive-type.table";
        case PrimitiveTypeConstant.Text:
            return "constant.primitive-type.text";
        case PrimitiveTypeConstant.Time:
            return "constant.primitive-type.time";
        case PrimitiveTypeConstant.Type:
            return "constant.primitive-type.type";
        case RelationalOperator.LessThan:
            return "constant.relational-operator.less-than";
        case RelationalOperator.LessThanEqualTo:
            return "constant.relational-operator.less-than-equal-to";
        case RelationalOperator.GreaterThan:
            return "constant.relational-operator.greater-than";
        case RelationalOperator.GreaterThanEqualTo:
            return "constant.relational-operator.greater-than-equal-to";
        case UnaryOperator.Positive:
            return "constant.unary-operator.positive";
        case UnaryOperator.Negative:
            return "constant.unary-operator.negative";
        case UnaryOperator.Not:
            return "constant.unary-operator.not";
        case WrapperConstant.LeftBrace:
            return "constant.wrapper.left-brace";
        case WrapperConstant.LeftBracket:
            return "constant.wrapper.left-bracket";
        case WrapperConstant.LeftParenthesis:
            return "constant.wrapper.left-parenthesis";
        case WrapperConstant.RightBrace:
            return "constant.wrapper.right-parenthesis";
        case WrapperConstant.RightBracket:
            return "constant.wrapper.right-bracket";
        case WrapperConstant.RightParenthesis:
            return "constant.wrapper.right-parenthesis";
        default:
            return "constant.unknown";
    }
}

export function nodeKd2Str(nodeKind: Ast.NodeKind): string {
    return nodeKind;
}

export function getNodeScopeName(node: Ast.TNode): string {
    switch (node.kind) {
        case Ast.NodeKind.Constant:
            return constKd2Str(node.constantKind);
        default:
            return node.kind;
    }
}
