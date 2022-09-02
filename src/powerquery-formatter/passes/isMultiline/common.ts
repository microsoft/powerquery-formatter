// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { IsMultilineMap } from "../commonTypes";

export function expectGetIsMultiline(isMultilineMap: IsMultilineMap, node: Ast.TNode): boolean {
    return PQP.MapUtils.assertGet(isMultilineMap, node.id, "missing expected nodeId", { nodeId: node.id });
}

export function setIsMultiline(isMultilineMap: IsMultilineMap, node: Ast.TNode, isMultiline: boolean): void {
    isMultilineMap.set(node.id, isMultiline);
}
