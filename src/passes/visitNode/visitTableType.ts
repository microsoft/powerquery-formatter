// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { SerializeParameter, SerializeParameterState, SerializerWriteKind } from "../types";
import { propagateWriteKind, setWorkspace } from "./visitNodeUtils";

export function visitTableType(state: SerializeParameterState, node: PQP.Language.Ast.TableType): void {
    propagateWriteKind(state, node, node.tableConstant);
    const rowType: PQP.Language.Ast.FieldSpecificationList | PQP.Language.Ast.TPrimaryExpression = node.rowType;
    const rowTypeIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, rowType);

    let rowTypeWorkspace: SerializeParameter;
    if (rowTypeIsMultiline) {
        rowTypeWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializerWriteKind.Indented,
        };
    } else {
        rowTypeWorkspace = {
            maybeWriteKind: SerializerWriteKind.PaddedLeft,
        };
    }
    setWorkspace(state, rowType, rowTypeWorkspace);
}
