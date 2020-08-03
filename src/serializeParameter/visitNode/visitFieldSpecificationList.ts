// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { SerializeParameter, SerializeParameterState, SerializerWriteKind } from "../types";
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
        const openRecordMarkerConstant: PQP.Language.Ast.IConstant<PQP.Language.Ast.MiscConstantKind.Ellipsis> =
            node.maybeOpenRecordMarkerConstant;
        let workspace: SerializeParameter;

        if (isMultiline) {
            workspace = {
                maybeIndentationChange: 1,
                maybeWriteKind: SerializerWriteKind.Indented,
            };
        } else if (fieldsArray.elements.length) {
            workspace = { maybeWriteKind: SerializerWriteKind.PaddedLeft };
        } else {
            workspace = { maybeWriteKind: SerializerWriteKind.Any };
        }
        setWorkspace(state, openRecordMarkerConstant, workspace);
    }
}
