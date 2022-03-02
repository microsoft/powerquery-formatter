// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";

import { IsMultilineMap, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";
import { setWorkspace } from "./visitNodeUtils";

export function visitSection(state: SerializeParameterState, node: PQP.Language.Ast.Section): void {
    const isMultilineMap: IsMultilineMap = state.isMultilineMap;

    let sectionConstantWriteKind: SerializeWriteKind = SerializeWriteKind.Any;
    const maybeLiteralAttributes: PQP.Language.Ast.RecordLiteral | undefined = node.maybeLiteralAttributes;

    if (maybeLiteralAttributes) {
        const literalAttributes: PQP.Language.Ast.RecordLiteral = maybeLiteralAttributes;

        if (expectGetIsMultiline(isMultilineMap, literalAttributes)) {
            sectionConstantWriteKind = SerializeWriteKind.Indented;
        } else {
            sectionConstantWriteKind = SerializeWriteKind.PaddedLeft;
        }
    }

    setWorkspace(state, node.sectionConstant, { maybeWriteKind: sectionConstantWriteKind });

    const maybeName: PQP.Language.Ast.Identifier | undefined = node.maybeName;

    if (maybeName) {
        const name: PQP.Language.Ast.Identifier = maybeName;
        setWorkspace(state, name, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    }
}
