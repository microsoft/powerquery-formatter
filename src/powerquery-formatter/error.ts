// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

export type FormatError<S extends PQP.Parser.IParseState = PQP.Parser.IParseState> =
    | PQP.Lexer.LexError.LexError
    | PQP.Parser.ParseError.ParseError<S>;

export type TFormatError<S extends PQP.Parser.IParseState = PQP.Parser.IParseState> =
    | PQP.Lexer.LexError.TLexError
    | PQP.Parser.ParseError.TParseError<S>;

export function isTFormatError<S extends PQP.Parser.IParseState = PQP.Parser.IParseState>(
    x: any,
): x is TFormatError<S> {
    return PQP.Lexer.LexError.isTLexError(x) || PQP.Parser.ParseError.isTParseError(x);
}
