// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";

export function visitTableType(state: SerializeParameterState, node: Ast.TableType): void {
    propagateWriteKind(state, node, node.tableConstant);
    const rowType: Ast.FieldSpecificationList | Ast.TPrimaryExpression = node.rowType;
    const rowTypeIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, rowType);

    let rowTypeWorkspace: SerializeParameter;

    if (rowTypeIsMultiline) {
        rowTypeWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializeWriteKind.Indented,
        };
    } else {
        rowTypeWorkspace = {
            maybeWriteKind: SerializeWriteKind.PaddedLeft,
        };
    }

    setWorkspace(state, rowType, rowTypeWorkspace);
}
