// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";

import { IsMultilineMap, SerializeParameterState, SerializeWriteKind } from "../commonTypes";
import { expectGetIsMultiline } from "../isMultiline/common";
import { setWorkspace } from "./visitNodeUtils";

export function visitSection(state: SerializeParameterState, node: Ast.Section): void {
    const isMultilineMap: IsMultilineMap = state.isMultilineMap;

    let sectionConstantWriteKind: SerializeWriteKind = SerializeWriteKind.Any;
    const maybeLiteralAttributes: Ast.RecordLiteral | undefined = node.maybeLiteralAttributes;

    if (maybeLiteralAttributes) {
        const literalAttributes: Ast.RecordLiteral = maybeLiteralAttributes;

        if (expectGetIsMultiline(isMultilineMap, literalAttributes)) {
            sectionConstantWriteKind = SerializeWriteKind.Indented;
        } else {
            sectionConstantWriteKind = SerializeWriteKind.PaddedLeft;
        }
    }

    setWorkspace(state, node.sectionConstant, { maybeWriteKind: sectionConstantWriteKind });

    const maybeName: Ast.Identifier | undefined = node.maybeName;

    if (maybeName) {
        const name: Ast.Identifier = maybeName;
        setWorkspace(state, name, { maybeWriteKind: SerializeWriteKind.PaddedLeft });
    }
}
