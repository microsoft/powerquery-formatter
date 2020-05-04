// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

export type TFormatError<S extends PQP.IParserState = PQP.IParserState> =
    | PQP.LexError.TLexError
    | PQP.ParseError.TParseError<S>;

export function isTFormatError<S extends PQP.IParserState = PQP.IParserState>(x: any): x is TFormatError<S> {
    return PQP.LexError.isTLexError(x) || PQP.ParseError.isTParseError(x);
}
