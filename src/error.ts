// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

export type TFormatError<S extends PQP.Parser.IParserState = PQP.Parser.IParserState> =
    | PQP.Lexer.LexError.TLexError
    | PQP.Parser.ParseError.TParseError<S>;

export function isTFormatError<S extends PQP.Parser.IParserState = PQP.Parser.IParserState>(
    x: any,
): x is TFormatError<S> {
    return PQP.Lexer.LexError.isTLexError(x) || PQP.Parser.ParseError.isTParseError(x);
}
