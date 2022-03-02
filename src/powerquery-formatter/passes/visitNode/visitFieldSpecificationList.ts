// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { SerializeParameter, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";
import { setWorkspace } from "./visitNodeUtils";
import { visitTWrapped } from "./visitTWrapped";

// TPairedConstant override
export function visitFieldSpecificationList(state: SerializeParameterState, node: Ast.FieldSpecificationList): void {
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);

    const fieldsArray: Ast.IArrayWrapper<Ast.ICsv<Ast.FieldSpecification>> = node.content;

    visitTWrapped(state, node);

    if (node.maybeOpenRecordMarkerConstant) {
        const openRecordMarkerConstant: Ast.IConstant<PQP.Language.Constant.MiscConstant.Ellipsis> =
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
