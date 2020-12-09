// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* tslint:disable:no-console */
import * as PQP from "@microsoft/powerquery-parser";
import { FormatError, FormatSettings, tryFormat, IndentationLiteral, NewlineLiteral } from ".";

const text: string = `1 as number`;
const settings: FormatSettings = {
    ...PQP.DefaultSettings,
    indentationLiteral: IndentationLiteral.SpaceX4,
    newlineLiteral: NewlineLiteral.Unix,
};

const triedFormat: PQP.Result<string, FormatError.TFormatError> = tryFormat(settings, text);
if (PQP.ResultUtils.isOk(triedFormat)) {
    console.log(triedFormat.value);
} else {
    console.log(JSON.stringify(triedFormat.error, undefined, 4));
}
