// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../types";
import { setWorkspace } from "./visitNodeUtils";
import { visitTWrapped } from "./visitTWrapped";

// TPairedConstant override
export function visitFieldSpecificationList(
    state: SerializeParameterState,
    node: PQP.Language.Ast.FieldSpecificationList,
): void {
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);
    const fieldsArray: PQP.Language.Ast.IArrayWrapper<PQP.Language.Ast.ICsv<PQP.Language.Ast.FieldSpecification>> =
        node.content;
    visitTWrapped(state, node);

    if (node.maybeOpenRecordMarkerConstant) {
        const openRecordMarkerConstant: PQP.Language.Ast.IConstant<PQP.Language.Constant.MiscConstantKind.Ellipsis> =
            node.maybeOpenRecordMarkerConstant;
        let workspace: SerializeParameter;

        if (isMultiline) {
            workspace = {
                maybeIndentationChange: 1,
                maybeWriteKind: SerializeWriteKind.Indented,
            };
        } else if (fieldsArray.elements.length) {
            workspace = { maybeWriteKind: SerializeWriteKind.PaddedLeft };
        } else {
            workspace = { maybeWriteKind: SerializeWriteKind.Any };
        }
        setWorkspace(state, openRecordMarkerConstant, workspace);
    }
}
