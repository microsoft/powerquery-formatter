// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { expectGetIsMultiline } from "../isMultiline/common";
import { IsMultilineMap, SerializeParameterState, SerializerWriteKind } from "../types";
import { setWorkspace } from "./visitNodeUtils";

export function visitSection(state: SerializeParameterState, node: PQP.Language.Ast.Section): void {
    const isMultilineMap: IsMultilineMap = state.isMultilineMap;

    let sectionConstantWriteKind: SerializerWriteKind = SerializerWriteKind.Any;
    const maybeLiteralAttributes: PQP.Language.Ast.RecordLiteral | undefined = node.maybeLiteralAttributes;
    if (maybeLiteralAttributes) {
        const literalAttributes: PQP.Language.Ast.RecordLiteral = maybeLiteralAttributes;

        if (expectGetIsMultiline(isMultilineMap, literalAttributes)) {
            sectionConstantWriteKind = SerializerWriteKind.Indented;
        } else {
            sectionConstantWriteKind = SerializerWriteKind.PaddedLeft;
        }
    }
    setWorkspace(state, node.sectionConstant, { maybeWriteKind: sectionConstantWriteKind });

    const maybeName: PQP.Language.Ast.Identifier | undefined = node.maybeName;
    if (maybeName) {
        const name: PQP.Language.Ast.Identifier = maybeName;
        setWorkspace(state, name, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
    }
}
