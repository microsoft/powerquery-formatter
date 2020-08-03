import { SerializerParameterMap, SerializerWriteKind } from "./types";

import * as PQP from "@microsoft/powerquery-parser";
export function getSerializerWriteKind(
    node: PQP.Language.Ast.TNode,
    serializerParametersMap: SerializerParameterMap,
): SerializerWriteKind {
    const maybeWriteKind: SerializerWriteKind | undefined = serializerParametersMap.writeKind.get(node.id);
    if (maybeWriteKind) {
        return maybeWriteKind;
    } else {
        const details: {} = { node };
        throw new PQP.CommonError.InvariantError("expected node to be in SerializerParameterMap.writeKind", details);
    }
}
