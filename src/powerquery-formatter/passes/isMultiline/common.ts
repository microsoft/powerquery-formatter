// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { IsMultilineMap } from "../commonTypes";

export function expectGetIsMultiline(isMultilineMap: IsMultilineMap, node: Ast.TNode): boolean {
    const maybeIsMultiline: boolean | undefined = isMultilineMap.get(node.id);

    if (maybeIsMultiline === undefined) {
        throw new PQP.CommonError.InvariantError(`isMultiline is missing an expected nodeId`, { nodeId: node.id });
    }

    return maybeIsMultiline;
}

export function setIsMultiline(isMultilineMap: IsMultilineMap, node: Ast.TNode, isMultiline: boolean): void {
    isMultilineMap.set(node.id, isMultiline);
}
