// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* tslint:disable:no-console */

import * as PQP from "@microsoft/powerquery-parser";

import { FormatSettings, IndentationLiteral, NewlineLiteral, TriedFormat, tryFormat } from ".";

const text: string = `1 as number`;

const settings: FormatSettings = {
    ...PQP.DefaultSettings,
    indentationLiteral: IndentationLiteral.SpaceX4,
    newlineLiteral: NewlineLiteral.Unix,
};

tryFormat(settings, text)
    .then((triedFormat: TriedFormat) => {
        if (PQP.ResultUtils.isOk(triedFormat)) {
            console.log("Your input was formatted as the following:");
            console.log(triedFormat.value);
        } else {
            console.log("An error occured during the format. Please review the error.");
            console.log(JSON.stringify(triedFormat.error, undefined, 4));
        }
    })
    .catch(() => console.log("An uncaught error was thrown"));
