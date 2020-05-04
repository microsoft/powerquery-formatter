// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { CommentCollection, CommentCollectionMap } from "./comment";
import { expectGetIsMultiline, IsMultilineMap } from "./isMultiline/common";

// TNodes (in general) have two responsibilities:
// * if given a Workspace, then propagate the SerializerWriteKind to their first child,
//   this is done using propagateWriteKind(state, parentNode, childNode)
// * suggest an indentation change and SerializerWriteKind for their children,
//   this is done using setWorkspace(state, childNode, workspace)

export type IndentationChange = -1 | 1;

export const enum SerializerWriteKind {
    Any = "Any",
    DoubleNewline = "DoubleNewline",
    Indented = "Indented",
    PaddedLeft = "PaddedLeft",
    PaddedRight = "PaddedRight",
}

export interface SerializerParameterMap {
    readonly indentationChange: Map<number, IndentationChange>;
    readonly writeKind: Map<number, SerializerWriteKind>;
    readonly comments: Map<number, ReadonlyArray<SerializeCommentParameter>>;
}

export interface SerializeCommentParameter {
    readonly literal: string;
    readonly writeKind: SerializerWriteKind;
}

export function tryTraverse(
    localizationTemplates: PQP.ILocalizationTemplates,
    ast: PQP.Language.Ast.TNode,
    nodeIdMapCollection: PQP.NodeIdMap.Collection,
    commentCollectionMap: CommentCollectionMap,
    isMultilineMap: IsMultilineMap,
): PQP.Traverse.TriedTraverse<SerializerParameterMap> {
    const state: State = {
        result: {
            writeKind: new Map(),
            indentationChange: new Map(),
            comments: new Map(),
        },
        localizationTemplates,
        nodeIdMapCollection,
        commentCollectionMap,
        isMultilineMap,
        workspaceMap: new Map(),
    };
    return PQP.Traverse.tryTraverseAst(
        state,
        nodeIdMapCollection,
        ast,
        PQP.Traverse.VisitNodeStrategy.BreadthFirst,
        visitNode,
        PQP.Traverse.expectExpandAllAstChildren,
        undefined,
    );
}

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

interface State extends PQP.Traverse.IState<SerializerParameterMap> {
    readonly localizationTemplates: PQP.ILocalizationTemplates;
    readonly nodeIdMapCollection: PQP.NodeIdMap.Collection;
    readonly commentCollectionMap: CommentCollectionMap;
    readonly isMultilineMap: IsMultilineMap;
    readonly workspaceMap: Map<number, Workspace>;
}

// temporary storage used during traversal
interface Workspace {
    readonly maybeIndentationChange?: IndentationChange;
    readonly maybeWriteKind?: SerializerWriteKind;
}

const DefaultWorkspace: Workspace = {
    maybeWriteKind: SerializerWriteKind.Any,
    maybeIndentationChange: undefined,
};

function visitNode(state: State, node: PQP.Language.Ast.TNode): void {
    switch (node.kind) {
        case PQP.Language.Ast.NodeKind.ArrayWrapper: {
            const parent: PQP.Language.Ast.TNode = PQP.NodeIdMapUtils.expectParentAstNode(
                state.nodeIdMapCollection,
                node.id,
            );

            switch (parent.kind) {
                case PQP.Language.Ast.NodeKind.Section:
                    visitArrayWrapperForSectionMembers(state, parent.sectionMembers);
                    break;

                case PQP.Language.Ast.NodeKind.UnaryExpression:
                    visitArrayWrapperForUnaryExpression(state, parent.operators);
                    break;

                default:
                    visitArrayWrapper(state, node);
            }
            break;
        }

        // TPairedConstant
        case PQP.Language.Ast.NodeKind.AsNullablePrimitiveType:
        case PQP.Language.Ast.NodeKind.AsType:
        case PQP.Language.Ast.NodeKind.EachExpression:
        case PQP.Language.Ast.NodeKind.IsNullablePrimitiveType:
        case PQP.Language.Ast.NodeKind.NullablePrimitiveType:
        case PQP.Language.Ast.NodeKind.NullableType:
        case PQP.Language.Ast.NodeKind.OtherwiseExpression: {
            propagateWriteKind(state, node, node.constant);

            const isPairedMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.paired);
            if (isPairedMultiline) {
                setWorkspace(state, node.paired, {
                    maybeIndentationChange: 1,
                    maybeWriteKind: SerializerWriteKind.Indented,
                });
            } else {
                setWorkspace(state, node.paired, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
            }
            break;
        }

        // TBinOpExpression
        case PQP.Language.Ast.NodeKind.ArithmeticExpression:
        case PQP.Language.Ast.NodeKind.AsExpression:
        case PQP.Language.Ast.NodeKind.EqualityExpression:
        case PQP.Language.Ast.NodeKind.IsExpression:
        case PQP.Language.Ast.NodeKind.LogicalExpression:
        case PQP.Language.Ast.NodeKind.RelationalExpression: {
            propagateWriteKind(state, node, node.left);
            const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);

            if (isMultiline) {
                setWorkspace(state, node.operatorConstant, { maybeWriteKind: SerializerWriteKind.Indented });
                setWorkspace(state, node.right, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
            } else if (node.kind === PQP.Language.Ast.NodeKind.LogicalExpression && isMultiline) {
                setWorkspace(state, node.operatorConstant, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
                setWorkspace(state, node.right, { maybeWriteKind: SerializerWriteKind.Indented });
            } else {
                setWorkspace(state, node.operatorConstant, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
                setWorkspace(state, node.right, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
            }

            break;
        }

        // TKeyValuePair
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedAnyLiteral:
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedExpression:
        case PQP.Language.Ast.NodeKind.IdentifierPairedExpression:
            visitKeyValuePair(state, node);
            break;

        case PQP.Language.Ast.NodeKind.ListLiteral:
        case PQP.Language.Ast.NodeKind.ListExpression:
        case PQP.Language.Ast.NodeKind.RecordExpression:
        case PQP.Language.Ast.NodeKind.RecordLiteral:
            visitWrapped(state, node);
            break;

        case PQP.Language.Ast.NodeKind.Csv: {
            const workspace: Workspace = getWorkspace(state, node);
            const maybeWriteKind: SerializerWriteKind | undefined = workspace.maybeWriteKind;
            propagateWriteKind(state, node, node.node);

            if (node.maybeCommaConstant && maybeWriteKind !== SerializerWriteKind.Indented) {
                const commaConstant: PQP.Language.Ast.IConstant<PQP.Language.Ast.MiscConstantKind.Comma> =
                    node.maybeCommaConstant;
                setWorkspace(state, commaConstant, { maybeWriteKind: SerializerWriteKind.PaddedRight });
            }
            break;
        }

        case PQP.Language.Ast.NodeKind.ErrorHandlingExpression: {
            const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);
            propagateWriteKind(state, node, node.tryConstant);

            const protectedIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.protectedExpression);
            if (protectedIsMultiline) {
                setWorkspace(state, node.protectedExpression, {
                    maybeIndentationChange: 1,
                    maybeWriteKind: SerializerWriteKind.Indented,
                });
            } else {
                setWorkspace(state, node.protectedExpression, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
            }

            if (node.maybeOtherwiseExpression) {
                const otherwiseExpression: PQP.Language.Ast.OtherwiseExpression = node.maybeOtherwiseExpression;

                let otherwiseWriteKind: SerializerWriteKind;
                if (isMultiline) {
                    otherwiseWriteKind = SerializerWriteKind.Indented;
                } else {
                    otherwiseWriteKind = SerializerWriteKind.PaddedLeft;
                }

                setWorkspace(state, otherwiseExpression, { maybeWriteKind: otherwiseWriteKind });
            }
            break;
        }

        // TPairedConstant override
        case PQP.Language.Ast.NodeKind.ErrorRaisingExpression: {
            propagateWriteKind(state, node, node.constant);

            let pairedWorkspace: Workspace;
            switch (node.paired.kind) {
                case PQP.Language.Ast.NodeKind.ListExpression:
                case PQP.Language.Ast.NodeKind.RecordExpression:
                    pairedWorkspace = {
                        maybeWriteKind: SerializerWriteKind.PaddedLeft,
                    };
                    break;

                default:
                    const pairedIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.paired);
                    if (pairedIsMultiline) {
                        pairedWorkspace = {
                            maybeIndentationChange: 1,
                            maybeWriteKind: SerializerWriteKind.Indented,
                        };
                    } else {
                        pairedWorkspace = { maybeWriteKind: SerializerWriteKind.PaddedLeft };
                    }
            }
            setWorkspace(state, node.paired, pairedWorkspace);
            break;
        }

        case PQP.Language.Ast.NodeKind.FieldProjection:
            visitWrapped(state, node);
            break;

        case PQP.Language.Ast.NodeKind.FieldSelector:
            propagateWriteKind(state, node, node.openWrapperConstant);
            break;

        case PQP.Language.Ast.NodeKind.FieldSpecification: {
            const maybeOptionalConstant:
                | PQP.Language.Ast.IConstant<PQP.Language.Ast.IdentifierConstantKind.Optional>
                | undefined = node.maybeOptionalConstant;

            if (maybePropagateWriteKind(state, node, maybeOptionalConstant)) {
                setWorkspace(state, node.name, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
            } else {
                propagateWriteKind(state, node, node.name);
            }

            const maybeFieldTypeSpecification: PQP.Language.Ast.FieldTypeSpecification | undefined =
                node.maybeFieldTypeSpecification;
            if (maybeFieldTypeSpecification) {
                const fieldTypeSpecification: PQP.Language.Ast.FieldTypeSpecification = maybeFieldTypeSpecification;
                const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, fieldTypeSpecification);
                let typeWorkspace: Workspace;

                if (isMultiline) {
                    typeWorkspace = {
                        maybeIndentationChange: 1,
                        maybeWriteKind: SerializerWriteKind.Indented,
                    };
                } else {
                    typeWorkspace = { maybeWriteKind: SerializerWriteKind.PaddedLeft };
                }
                setWorkspace(state, fieldTypeSpecification, typeWorkspace);
            }
            break;
        }

        case PQP.Language.Ast.NodeKind.FieldSpecificationList: {
            const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);
            const fieldsArray: PQP.Language.Ast.IArrayWrapper<PQP.Language.Ast.ICsv<
                PQP.Language.Ast.FieldSpecification
            >> = node.content;
            visitWrapped(state, node);

            if (node.maybeOpenRecordMarkerConstant) {
                const openRecordMarkerConstant: PQP.Language.Ast.IConstant<PQP.Language.Ast.MiscConstantKind.Ellipsis> =
                    node.maybeOpenRecordMarkerConstant;
                let workspace: Workspace;

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

            break;
        }

        case PQP.Language.Ast.NodeKind.FieldTypeSpecification: {
            // can't use propagateWriteKind as I want the equalConstant on the
            // same line as the previous node (FieldParameter).
            const workspace: Workspace = getWorkspace(state, node);

            // assumes SerializerWriteKind.Indented -> maybeIndentationChange === 1
            if (workspace.maybeWriteKind === SerializerWriteKind.Indented) {
                setWorkspace(state, node.equalConstant, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
                setWorkspace(state, node.fieldType, {
                    maybeIndentationChange: 1,
                    maybeWriteKind: SerializerWriteKind.Indented,
                });
            } else {
                propagateWriteKind(state, node, node.equalConstant);
                setWorkspace(state, node.fieldType, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
            }
            break;
        }

        case PQP.Language.Ast.NodeKind.FunctionExpression: {
            propagateWriteKind(state, node, node.parameters);

            if (node.maybeFunctionReturnType) {
                const functionReturnType: PQP.Language.Ast.AsNullablePrimitiveType = node.maybeFunctionReturnType;
                setWorkspace(state, functionReturnType, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
            }

            setWorkspace(state, node.fatArrowConstant, { maybeWriteKind: SerializerWriteKind.PaddedLeft });

            const expressionIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.expression);
            let expressionWorkspace: Workspace;
            if (expressionIsMultiline) {
                expressionWorkspace = {
                    maybeIndentationChange: 1,
                    maybeWriteKind: SerializerWriteKind.Indented,
                };
            } else {
                expressionWorkspace = { maybeWriteKind: SerializerWriteKind.PaddedLeft };
            }
            setWorkspace(state, node.expression, expressionWorkspace);

            break;
        }

        case PQP.Language.Ast.NodeKind.FunctionType: {
            propagateWriteKind(state, node, node.functionConstant);

            const commonWorkspace: Workspace = {
                maybeWriteKind: SerializerWriteKind.PaddedLeft,
            };
            setWorkspace(state, node.parameters, commonWorkspace);
            setWorkspace(state, node.functionReturnType, commonWorkspace);
            break;
        }

        case PQP.Language.Ast.NodeKind.IdentifierExpression:
            if (maybePropagateWriteKind(state, node, node.maybeInclusiveConstant)) {
                setWorkspace(state, node.identifier, DefaultWorkspace);
            } else {
                propagateWriteKind(state, node, node.identifier);
            }
            break;

        case PQP.Language.Ast.NodeKind.IfExpression:
            visitIfExpression(state, node);
            break;

        case PQP.Language.Ast.NodeKind.InvokeExpression:
            visitWrapped(state, node);
            break;

        case PQP.Language.Ast.NodeKind.ItemAccessExpression: {
            const isMultilineMap: IsMultilineMap = state.isMultilineMap;
            const isMultiline: boolean = expectGetIsMultiline(isMultilineMap, node);
            const itemSelector: PQP.Language.Ast.TExpression = node.content;
            const itemSelectorIsMultiline: boolean = expectGetIsMultiline(isMultilineMap, itemSelector);
            visitWrapped(state, node);

            if (isMultiline) {
                setWorkspace(state, itemSelector, {
                    maybeIndentationChange: 1,
                    maybeWriteKind: SerializerWriteKind.Indented,
                });
            }

            let closeWrapperConstantWorkspace: Workspace;
            if (itemSelectorIsMultiline) {
                switch (itemSelector.kind) {
                    case PQP.Language.Ast.NodeKind.ListExpression:
                    case PQP.Language.Ast.NodeKind.RecordExpression:
                        closeWrapperConstantWorkspace = { maybeWriteKind: SerializerWriteKind.Any };
                        break;

                    default:
                        closeWrapperConstantWorkspace = { maybeWriteKind: SerializerWriteKind.Indented };
                }
            } else {
                closeWrapperConstantWorkspace = {
                    maybeWriteKind: SerializerWriteKind.Any,
                };
            }
            setWorkspace(state, node.closeWrapperConstant, closeWrapperConstantWorkspace);
            break;
        }

        case PQP.Language.Ast.NodeKind.LetExpression:
            propagateWriteKind(state, node, node.letConstant);
            setWorkspace(state, node.inConstant, { maybeWriteKind: SerializerWriteKind.Indented });
            setWorkspace(state, node.expression, {
                maybeIndentationChange: 1,
                maybeWriteKind: SerializerWriteKind.Indented,
            });
            break;

        case PQP.Language.Ast.NodeKind.ListType: {
            const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);
            visitWrapped(state, node);

            if (isMultiline) {
                setWorkspace(state, node.content, {
                    maybeIndentationChange: 1,
                    maybeWriteKind: SerializerWriteKind.Indented,
                });
            }
            break;
        }

        case PQP.Language.Ast.NodeKind.MetadataExpression: {
            const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);
            propagateWriteKind(state, node, node.left);

            let otherWorkspace: Workspace;
            if (isMultiline) {
                otherWorkspace = {
                    maybeWriteKind: SerializerWriteKind.Indented,
                };
            } else {
                otherWorkspace = {
                    maybeWriteKind: SerializerWriteKind.PaddedLeft,
                };
            }

            setWorkspace(state, node.operatorConstant, otherWorkspace);
            setWorkspace(state, node.right, otherWorkspace);
            break;
        }

        case PQP.Language.Ast.NodeKind.NotImplementedExpression:
            propagateWriteKind(state, node, node.ellipsisConstant);
            break;

        case PQP.Language.Ast.NodeKind.Parameter: {
            if (node.maybeOptionalConstant) {
                const optionalConstant: PQP.Language.Ast.IConstant<PQP.Language.Ast.IdentifierConstantKind.Optional> =
                    node.maybeOptionalConstant;
                setWorkspace(state, optionalConstant, { maybeWriteKind: SerializerWriteKind.PaddedRight });
            }

            if (node.maybeParameterType) {
                const parameterType: PQP.Language.Ast.TParameterType = node.maybeParameterType;
                setWorkspace(state, parameterType, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
            }

            break;
        }

        case PQP.Language.Ast.NodeKind.ParameterList:
            propagateWriteKind(state, node, node.openWrapperConstant);
            break;

        case PQP.Language.Ast.NodeKind.ParenthesizedExpression: {
            const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);
            visitWrapped(state, node);

            if (isMultiline) {
                setWorkspace(state, node.content, {
                    maybeIndentationChange: 1,
                    maybeWriteKind: SerializerWriteKind.Indented,
                });
            }
            break;
        }

        case PQP.Language.Ast.NodeKind.PrimitiveType:
            propagateWriteKind(state, node, node.primitiveType);
            break;

        // Assumes the parent must be a CsvArray owned by a ListExpression,
        // meaning the Workspace can only get set in visitCsvArray.
        case PQP.Language.Ast.NodeKind.RangeExpression: {
            const workspace: Workspace = getWorkspace(state, node);
            propagateWriteKind(state, node, node.left);

            if (workspace.maybeWriteKind === SerializerWriteKind.Indented) {
                setWorkspace(state, node.rangeConstant, { maybeWriteKind: SerializerWriteKind.Indented });
                setWorkspace(state, node.right, { maybeWriteKind: SerializerWriteKind.Indented });
            }

            break;
        }

        case PQP.Language.Ast.NodeKind.RecordType: {
            const workspace: Workspace = getWorkspace(state, node);
            setWorkspace(state, node.fields, workspace);
            break;
        }

        case PQP.Language.Ast.NodeKind.RecursivePrimaryExpression:
            propagateWriteKind(state, node, node.head);
            break;

        case PQP.Language.Ast.NodeKind.TableType: {
            propagateWriteKind(state, node, node.tableConstant);
            const rowType: PQP.Language.Ast.FieldSpecificationList | PQP.Language.Ast.TPrimaryExpression = node.rowType;
            const rowTypeIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, rowType);

            let rowTypeWorkspace: Workspace;
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
            break;
        }

        case PQP.Language.Ast.NodeKind.Section: {
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

            break;
        }

        case PQP.Language.Ast.NodeKind.SectionMember: {
            const isMultilineMap: IsMultilineMap = state.isMultilineMap;
            let maybeSharedConstantWriteKind: SerializerWriteKind | undefined;
            let isNameExpressionPairWorkspaceSet: boolean = false;

            if (node.maybeLiteralAttributes) {
                const literalAttributes: PQP.Language.Ast.RecordLiteral = node.maybeLiteralAttributes;
                propagateWriteKind(state, node, literalAttributes);

                if (expectGetIsMultiline(isMultilineMap, literalAttributes)) {
                    maybeSharedConstantWriteKind = SerializerWriteKind.Indented;
                } else {
                    maybeSharedConstantWriteKind = SerializerWriteKind.PaddedLeft;
                }
            } else if (node.maybeSharedConstant) {
                const sharedConstant: PQP.Language.Ast.IConstant<PQP.Language.Ast.KeywordConstantKind.Shared> =
                    node.maybeSharedConstant;
                propagateWriteKind(state, node, sharedConstant);
            } else {
                propagateWriteKind(state, node, node.namePairedExpression);
                isNameExpressionPairWorkspaceSet = true;
            }

            if (node.maybeSharedConstant && maybeSharedConstantWriteKind) {
                const sharedConstant: PQP.Language.Ast.IConstant<PQP.Language.Ast.KeywordConstantKind.Shared> =
                    node.maybeSharedConstant;
                setWorkspace(state, sharedConstant, { maybeWriteKind: maybeSharedConstantWriteKind });
            }

            if (!isNameExpressionPairWorkspaceSet) {
                let isNameExpressionPairIndented: boolean = false;
                if (node.maybeSharedConstant) {
                    const sharedConstant: PQP.Language.Ast.IConstant<PQP.Language.Ast.KeywordConstantKind.Shared> =
                        node.maybeSharedConstant;

                    if (expectGetIsMultiline(isMultilineMap, sharedConstant)) {
                        isNameExpressionPairIndented = true;
                    }
                } else if (node.maybeLiteralAttributes) {
                    const literalAttributes: PQP.Language.Ast.RecordLiteral = node.maybeLiteralAttributes;

                    if (expectGetIsMultiline(isMultilineMap, literalAttributes)) {
                        isNameExpressionPairIndented = true;
                    }
                }

                let writeKind: SerializerWriteKind;
                if (isNameExpressionPairIndented) {
                    writeKind = SerializerWriteKind.Indented;
                } else {
                    writeKind = SerializerWriteKind.PaddedLeft;
                }
                setWorkspace(state, node.namePairedExpression, { maybeWriteKind: writeKind });
            }
            break;
        }

        // TPairedConstant overload
        case PQP.Language.Ast.NodeKind.TypePrimaryType: {
            propagateWriteKind(state, node, node.constant);

            const paired: PQP.Language.Ast.TPrimaryType = node.paired;
            const pairedIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, paired);
            let pairedWorkspace: Workspace;
            if (skipPrimaryTypeIndentation(paired)) {
                pairedWorkspace = {
                    maybeWriteKind: SerializerWriteKind.PaddedLeft,
                };
            } else if (pairedIsMultiline) {
                pairedWorkspace = {
                    maybeIndentationChange: 1,
                    maybeWriteKind: SerializerWriteKind.Indented,
                };
            } else {
                pairedWorkspace = { maybeWriteKind: SerializerWriteKind.PaddedLeft };
            }
            setWorkspace(state, paired, pairedWorkspace);
            break;
        }

        case PQP.Language.Ast.NodeKind.UnaryExpression: {
            propagateWriteKind(state, node, node.operators);

            const operators: ReadonlyArray<PQP.Language.Ast.IConstant<PQP.Language.Ast.UnaryOperatorKind>> =
                node.operators.elements;
            const lastOperator: PQP.Language.Ast.IConstant<PQP.Language.Ast.UnaryOperatorKind> =
                operators[operators.length - 1];
            if (lastOperator.constantKind === PQP.Language.Ast.UnaryOperatorKind.Not) {
                setWorkspace(state, node.typeExpression, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
            }
            break;
        }

        // Leaf nodes.
        // If a parent gave the leaf node a workspace it assigns indentationChange,
        // while writeType can be overwritten if the leaf node has a multiline comment attached.
        case PQP.Language.Ast.NodeKind.Constant:
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifier:
        case PQP.Language.Ast.NodeKind.Identifier:
        case PQP.Language.Ast.NodeKind.LiteralExpression: {
            const workspace: Workspace = getWorkspace(state, node);
            maybeSetIndentationChange(state, node, workspace.maybeIndentationChange);

            let maybeWriteKind: SerializerWriteKind | undefined = workspace.maybeWriteKind;
            maybeWriteKind = visitComments(state, node, maybeWriteKind);
            if (!maybeWriteKind) {
                const details: {} = {
                    node,
                    maybeWriteKind,
                };
                throw new PQP.CommonError.InvariantError("maybeWriteKind should be truthy", details);
            }

            state.result.writeKind.set(node.id, maybeWriteKind);
            break;
        }

        default:
            throw PQP.isNever(node);
    }
}

function getWorkspace(state: State, node: PQP.Language.Ast.TNode, fallback: Workspace = DefaultWorkspace): Workspace {
    const maybeWorkspace: Workspace | undefined = state.workspaceMap.get(node.id);

    if (maybeWorkspace !== undefined) {
        return maybeWorkspace;
    } else {
        return fallback;
    }
}

function setWorkspace(state: State, node: PQP.Language.Ast.TNode, workspace: Workspace): void {
    state.workspaceMap.set(node.id, workspace);
}

// sets indentationChange for the parent using the parent's Workspace,
// then propagates the writeKind to firstChild by setting its Workspace.
function propagateWriteKind(state: State, parent: PQP.Language.Ast.TNode, firstChild: PQP.Language.Ast.TNode): void {
    const workspace: Workspace = getWorkspace(state, parent);
    maybeSetIndentationChange(state, parent, workspace.maybeIndentationChange);

    const maybeWriteKind: SerializerWriteKind | undefined = workspace.maybeWriteKind;
    if (maybeWriteKind) {
        setWorkspace(state, firstChild, { maybeWriteKind });
    }
}

function maybePropagateWriteKind(
    state: State,
    parent: PQP.Language.Ast.TNode,
    maybeFirstChild: PQP.Language.Ast.TNode | undefined,
): boolean {
    if (maybeFirstChild) {
        const firstChild: PQP.Language.Ast.TNode = maybeFirstChild;
        propagateWriteKind(state, parent, firstChild);
        return true;
    } else {
        return false;
    }
}

function maybeSetIndentationChange(
    state: State,
    node: PQP.Language.Ast.TNode,
    maybeIndentationChange: IndentationChange | undefined,
): void {
    if (maybeIndentationChange) {
        state.result.indentationChange.set(node.id, maybeIndentationChange);
    }
}

// serves three purposes:
//  * propagates the TNode's writeKind to the first comment
//  * assigns writeKind for all comments attached to the TNode
//  * conditionally changes the TNode's writeKind based on the last comment's writeKind
//
// for example if maybeWriteKind === PaddedLeft and the TNode has two line comments:
//  * the first comment is set to PaddedLeft (from maybeWriteKind)
//  * the second comment is set to Indented (default for comment with newline)
//  * the TNode is set to Indented (last comment contains a newline)
function visitComments(
    state: State,
    node: PQP.Language.Ast.TNode,
    maybeWriteKind: SerializerWriteKind | undefined,
): SerializerWriteKind | undefined {
    const nodeId: number = node.id;
    const maybeComments: CommentCollection | undefined = state.commentCollectionMap.get(nodeId);
    if (!maybeComments) {
        return maybeWriteKind;
    }

    const commentParameters: SerializeCommentParameter[] = [];
    const comments: ReadonlyArray<PQP.Language.TComment> = maybeComments.prefixedComments;

    const numComments: number = comments.length;
    if (!numComments) {
        return maybeWriteKind;
    }

    for (let index: number = 0; index < numComments; index += 1) {
        const comment: PQP.Language.TComment = comments[index];
        const previousComment: PQP.Language.TComment | undefined = comments[index - 1];

        let writeKind: SerializerWriteKind;
        if (index === 0) {
            writeKind = maybeWriteKind || SerializerWriteKind.Any;
        } else if (comment.containsNewline) {
            writeKind = SerializerWriteKind.Indented;
        } else if (previousComment && previousComment.containsNewline) {
            writeKind = SerializerWriteKind.Indented;
        } else {
            writeKind = SerializerWriteKind.Any;
        }

        commentParameters.push({
            literal: comment.data,
            writeKind,
        });
    }

    state.result.comments.set(nodeId, commentParameters);

    const lastComment: PQP.Language.TComment = comments[comments.length - 1];
    if (lastComment.containsNewline) {
        maybeWriteKind = SerializerWriteKind.Indented;
    } else {
        maybeWriteKind = SerializerWriteKind.PaddedLeft;
    }

    return maybeWriteKind;
}

function visitKeyValuePair(state: State, node: PQP.Language.Ast.TKeyValuePair): void {
    const isMultilineMap: IsMultilineMap = state.isMultilineMap;
    const equalConstantIsMultiline: boolean = expectGetIsMultiline(isMultilineMap, node.equalConstant);
    const valueIsMultiline: boolean = expectGetIsMultiline(isMultilineMap, node.value);
    propagateWriteKind(state, node, node.key);

    let equalWorkspace: Workspace;
    if (equalConstantIsMultiline) {
        equalWorkspace = { maybeWriteKind: SerializerWriteKind.Indented };
    } else {
        equalWorkspace = { maybeWriteKind: SerializerWriteKind.PaddedLeft };
    }
    setWorkspace(state, node.equalConstant, equalWorkspace);

    let valueWorkspace: Workspace;
    if (valueIsMultiline) {
        valueWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializerWriteKind.Indented,
        };
    } else {
        valueWorkspace = { maybeWriteKind: SerializerWriteKind.PaddedLeft };
    }
    setWorkspace(state, node.value, valueWorkspace);
}

function visitArrayWrapper(state: State, node: PQP.Language.Ast.TArrayWrapper): void {
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node);

    let maybeWriteKind: SerializerWriteKind | undefined;
    let maybeIndentationChange: IndentationChange | undefined;
    if (isMultiline) {
        maybeWriteKind = SerializerWriteKind.Indented;
        maybeIndentationChange = 1;
    } else {
        maybeWriteKind = SerializerWriteKind.Any;
    }

    for (const element of node.elements) {
        setWorkspace(state, element, {
            maybeWriteKind,
            maybeIndentationChange,
        });
    }
}

function visitArrayWrapperForSectionMembers(
    state: State,
    node: PQP.Language.Ast.IArrayWrapper<PQP.Language.Ast.SectionMember>,
): void {
    let maybePreviousSectionMember: PQP.Language.Ast.SectionMember | undefined;
    for (const member of node.elements) {
        if (member.kind !== PQP.Language.Ast.NodeKind.SectionMember) {
            const details: {} = { nodeKind: member.kind };
            throw new PQP.CommonError.InvariantError(`expected sectionMember`, details);
        }

        let memberWriteKind: SerializerWriteKind = SerializerWriteKind.DoubleNewline;

        if (maybePreviousSectionMember && isSectionMemeberSimilarScope(member, maybePreviousSectionMember)) {
            memberWriteKind = SerializerWriteKind.Indented;
        }

        setWorkspace(state, member, { maybeWriteKind: memberWriteKind });

        maybePreviousSectionMember = member;
    }
}

function visitArrayWrapperForUnaryExpression(
    state: State,
    node: PQP.Language.Ast.IArrayWrapper<PQP.Language.Ast.IConstant<PQP.Language.Ast.UnaryOperatorKind>>,
): void {
    // `not` is an unary operator which needs to be padded.
    // The default Any write kind is fine for the other operators (`+` and `-`).
    const elements: ReadonlyArray<PQP.Language.Ast.IConstant<PQP.Language.Ast.UnaryOperatorKind>> = node.elements;
    const numElements: number = node.elements.length;

    propagateWriteKind(state, node, elements[0]);
    let previousWasNotOperator: boolean = elements[0].constantKind === PQP.Language.Ast.UnaryOperatorKind.Not;
    for (let index: number = 1; index < numElements; index += 1) {
        const operatorConstant: PQP.Language.Ast.IConstant<PQP.Language.Ast.UnaryOperatorKind> = elements[index];

        if (previousWasNotOperator || operatorConstant.constantKind === PQP.Language.Ast.UnaryOperatorKind.Not) {
            setWorkspace(state, operatorConstant, { maybeWriteKind: SerializerWriteKind.PaddedLeft });
        }
        previousWasNotOperator = operatorConstant.constantKind === PQP.Language.Ast.UnaryOperatorKind.Not;
    }
}

function visitIfExpression(state: State, node: PQP.Language.Ast.IfExpression): void {
    propagateWriteKind(state, node, node.ifConstant);

    const conditionIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, node.condition);

    let conditionWorkspace: Workspace;
    let thenConstantWorkspace: Workspace;
    if (conditionIsMultiline) {
        conditionWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializerWriteKind.Indented,
        };
        thenConstantWorkspace = {
            maybeWriteKind: SerializerWriteKind.Indented,
        };
    } else {
        conditionWorkspace = {
            maybeWriteKind: SerializerWriteKind.PaddedLeft,
        };
        thenConstantWorkspace = {
            maybeWriteKind: SerializerWriteKind.PaddedLeft,
        };
    }
    setWorkspace(state, node.condition, conditionWorkspace);
    setWorkspace(state, node.thenConstant, thenConstantWorkspace);
    setWorkspace(state, node.trueExpression, {
        maybeIndentationChange: 1,
        maybeWriteKind: SerializerWriteKind.Indented,
    });

    const falseExpression: PQP.Language.Ast.TExpression = node.falseExpression;
    let falseExpressionWorkspace: Workspace;
    if (falseExpression.kind === PQP.Language.Ast.NodeKind.IfExpression) {
        falseExpressionWorkspace = {
            maybeWriteKind: SerializerWriteKind.PaddedLeft,
        };
    } else {
        falseExpressionWorkspace = {
            maybeIndentationChange: 1,
            maybeWriteKind: SerializerWriteKind.Indented,
        };
    }
    setWorkspace(state, node.elseConstant, { maybeWriteKind: SerializerWriteKind.Indented });
    setWorkspace(state, falseExpression, falseExpressionWorkspace);
}

function visitWrapped(state: State, wrapped: PQP.Language.Ast.TWrapped): void {
    const isMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, wrapped);
    // not const as it's conditionally overwritten if SerializerWriteKind.Indented
    let workspace: Workspace = getWorkspace(state, wrapped);

    if (workspace.maybeWriteKind === SerializerWriteKind.Indented) {
        const writeKind: SerializerWriteKind = wrapperOpenWriteKind(state, wrapped);

        if (writeKind !== SerializerWriteKind.Indented) {
            workspace = {
                maybeIndentationChange: undefined,
                maybeWriteKind: writeKind,
            };
        }
    }

    setWorkspace(state, wrapped, workspace);
    propagateWriteKind(state, wrapped, wrapped.openWrapperConstant);

    if (isMultiline) {
        setWorkspace(state, wrapped.closeWrapperConstant, { maybeWriteKind: SerializerWriteKind.Indented });
    }
}

function wrapperOpenWriteKind(state: State, wrapped: PQP.Language.Ast.TWrapped): SerializerWriteKind {
    // an open constant is multiline iff it is has a multiline comment
    const openIsMultiline: boolean = expectGetIsMultiline(state.isMultilineMap, wrapped.openWrapperConstant);
    if (openIsMultiline) {
        return SerializerWriteKind.Indented;
    }

    if (
        wrapped.kind === PQP.Language.Ast.NodeKind.InvokeExpression ||
        wrapped.kind === PQP.Language.Ast.NodeKind.ItemAccessExpression
    ) {
        return SerializerWriteKind.Any;
    }

    const nodeIdMapCollection: PQP.NodeIdMap.Collection = state.nodeIdMapCollection;
    let maybeParent: PQP.Language.Ast.TNode | undefined = PQP.NodeIdMapUtils.maybeParentAstNode(
        nodeIdMapCollection,
        wrapped.id,
    );
    if (maybeParent && maybeParent.kind === PQP.Language.Ast.NodeKind.Csv) {
        maybeParent = PQP.NodeIdMapUtils.maybeParentAstNode(nodeIdMapCollection, maybeParent.id);
    }
    if (maybeParent && maybeParent.kind === PQP.Language.Ast.NodeKind.ArrayWrapper) {
        maybeParent = PQP.NodeIdMapUtils.maybeParentAstNode(nodeIdMapCollection, maybeParent.id);
    }

    if (!maybeParent) {
        return SerializerWriteKind.Indented;
    }

    switch (maybeParent.kind) {
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedAnyLiteral:
        case PQP.Language.Ast.NodeKind.GeneralizedIdentifierPairedExpression:
        case PQP.Language.Ast.NodeKind.IdentifierPairedExpression:
        case PQP.Language.Ast.NodeKind.ListType:
        case PQP.Language.Ast.NodeKind.RecordType:
        case PQP.Language.Ast.NodeKind.TableType:
        case PQP.Language.Ast.NodeKind.TypePrimaryType:
            return SerializerWriteKind.PaddedLeft;

        case PQP.Language.Ast.NodeKind.ItemAccessExpression:
            return SerializerWriteKind.Any;

        default:
            return SerializerWriteKind.Indented;
    }
}

function skipPrimaryTypeIndentation(node: PQP.Language.Ast.TPrimaryType): boolean {
    switch (node.kind) {
        case PQP.Language.Ast.NodeKind.FunctionType:
        case PQP.Language.Ast.NodeKind.NullableType:
        case PQP.Language.Ast.NodeKind.TableType:
            return true;

        case PQP.Language.Ast.NodeKind.ListType:
        case PQP.Language.Ast.NodeKind.PrimitiveType:
        case PQP.Language.Ast.NodeKind.RecordType:
            return false;

        default:
            throw PQP.isNever(node);
    }
}

// By default SectionMembers are two newlines apart from one another.
// Like-named sections (ex. Foo.Alpha, Foo.Bravo) should be placed one newline apart.
function isSectionMemeberSimilarScope(
    left: PQP.Language.Ast.SectionMember,
    right: PQP.Language.Ast.SectionMember,
): boolean {
    const leftName: PQP.Language.Ast.Identifier = left.namePairedExpression.key;
    const leftScope: ReadonlyArray<string> = leftName.literal.split(".");
    const rightName: PQP.Language.Ast.Identifier = right.namePairedExpression.key;
    const rightScope: ReadonlyArray<string> = rightName.literal.split(".");

    return leftScope[0] === rightScope[0];
}
