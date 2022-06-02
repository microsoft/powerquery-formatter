// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { ThemeTrieElementRule } from "./themes";

import { IParameters, IThemeProvider } from "./types";

/**
 * The metadata containing the scopeName and matched theme rules of a scope name
 */
export class ScopeMetadata<T extends IParameters = IParameters> {
    constructor(public readonly scopeName: string, public readonly themeData: ThemeTrieElementRule<T>[]) {}
}

export class ScopeMetadataProvider<T extends IParameters = IParameters> {
    private static _NULL_SCOPE_METADATA: ScopeMetadata = new ScopeMetadata<IParameters>("", []);

    private _cache: Map<string, ScopeMetadata<T>> = undefined as unknown as Map<string, ScopeMetadata<T>>;
    private _defaultMetaData: ScopeMetadata<T> = undefined as unknown as ScopeMetadata<T>;

    private _doGetMetadataForScope(scopeName: string): ScopeMetadata<T> {
        const themeData: ThemeTrieElementRule<T>[] = this._themeProvider.themeMatch(scopeName);

        return new ScopeMetadata<T>(scopeName, themeData);
    }
    public getMetadataForScope(scopeName: string | undefined): ScopeMetadata<T> {
        // never hurts to be too careful
        if (scopeName === null || scopeName === undefined) {
            return ScopeMetadataProvider._NULL_SCOPE_METADATA as ScopeMetadata<T>;
        }

        let value: ScopeMetadata<T> | undefined = this._cache.get(scopeName);

        if (value) {
            return value;
        }

        value = this._doGetMetadataForScope(scopeName);
        this._cache.set(scopeName, value);

        return value;
    }

    constructor(private readonly _themeProvider: IThemeProvider<T>) {
        this.onDidChangeTheme();
    }
    public onDidChangeTheme(): void {
        this._cache = new Map();
        this._defaultMetaData = new ScopeMetadata<T>("", [this._themeProvider.getDefaults()]);
    }

    public getDefaultMetadata(): ScopeMetadata<T> {
        return this._defaultMetaData;
    }
}

export const EmptyScopeListElementParameters: IParameters = {};

/**
 * Immutable scope list element
 */
export class ScopeListElement<T extends IParameters = IParameters> {
    constructor(
        public readonly parent: ScopeListElement<T> | undefined,
        public readonly scope: string,
        public readonly parameters: T,
    ) {}

    private static _equals<T extends IParameters = IParameters>(
        l: ScopeListElement<T>,
        r: ScopeListElement<T>,
    ): boolean {
        let a: ScopeListElement | undefined = l;
        let b: ScopeListElement | undefined = r;

        do {
            if (a === b) {
                return true;
            }

            if (a.scope !== b.scope) {
                return false;
            }

            // Go to previous pair
            a = a.parent;
            b = b.parent;

            // unsafe a, b might be null

            if (!a && !b) {
                // End of list reached for both
                return true;
            }

            if (!a || !b) {
                // End of list reached only for one
                return false;
            }
            // safe a, b cannot be null
            // eslint-disable-next-line no-constant-condition
        } while (true);
    }

    public equals(other: ScopeListElement<T>): boolean {
        return ScopeListElement._equals(this, other);
    }

    private static _hasScopeNameCombinator(scopeName: string): boolean {
        if (scopeName.length < 1) {
            return false;
        }

        return scopeName[scopeName.length - 1] === ">";
    }

    private static _purgeScopeNameCombinator(scopeName: string): [boolean, string] {
        if (this._hasScopeNameCombinator(scopeName)) {
            return [true, scopeName.substring(0, scopeName.length - 1)];
        }

        return [false, scopeName];
    }

    private static _matchesScope(scope: string, selector: string, selectorWithDot: string): boolean {
        return selector === scope || scope.substring(0, selectorWithDot.length) === selectorWithDot;
    }

    private static _matches<T extends IParameters = IParameters>(
        target: ScopeListElement<T> | undefined,
        parentScopes: string[] | undefined,
    ): boolean {
        if (!parentScopes) {
            return true;
        }

        const len: number = parentScopes.length;
        let index: number = 0;

        // combinator would only exist in the parent scopes, but parentScope starts from the second
        const [isFirstScopeNameCombinator, firstScopeName]: [boolean, string] = this._purgeScopeNameCombinator(
            parentScopes[index],
        );

        let selector: string = firstScopeName;
        let selectorWithDot: string = `${selector}.`;
        let hasCombinator: boolean = isFirstScopeNameCombinator;

        while (target) {
            if (this._matchesScope(target.scope, selector, selectorWithDot)) {
                index = index + 1;

                if (index === len) {
                    return true;
                }

                const [isNextCombinator, nextScopeName]: [boolean, string] = this._purgeScopeNameCombinator(
                    parentScopes[index],
                );

                hasCombinator = isNextCombinator;
                selector = nextScopeName;
                selectorWithDot = `${selector}.`;
            } else if (hasCombinator) {
                // found a mismatched scope name of combinator
                return false;
            }

            target = target.parent;
        }

        return false;
    }

    /**
     * Merge any matching rules' metadata into current target metadata
     *
     * @param parameters        current target metadata record
     * @param scopesList            current scope list element
     * @param source                the source ScopeMetadata holding the rule might be matched
     * @return mergedMetaData       the number of merged metadata
     */
    public static mergeParameters<T extends IParameters = IParameters>(
        parameters: T,
        scopesList: ScopeListElement<T> | undefined,
        source: ScopeMetadata<T> | undefined,
    ): T {
        if (!source) {
            return parameters;
        }

        let assignedParameters: T | undefined = undefined;

        if (source.themeData) {
            // Find the first themeData that matches
            for (let i: number = 0; i < source.themeData.length; i += 1) {
                const themeData: ThemeTrieElementRule<T> = source.themeData[i];

                if (this._matches(scopesList, themeData.parentScopes)) {
                    assignedParameters = themeData.parameters;
                    break;
                }
            }
        }

        return assignedParameters ?? (EmptyScopeListElementParameters as T);
    }
    private static _push<T extends IParameters = IParameters>(
        target: ScopeListElement<T>,
        scopeMetadataProvider: ScopeMetadataProvider<T>,
        scopes: string[],
    ): ScopeListElement<T> {
        for (let i: number = 0; i < scopes.length; i += 1) {
            const scope: string = scopes[i];
            const rawMetadata: ScopeMetadata<T> = scopeMetadataProvider.getMetadataForScope(scope);

            const parameters: T = ScopeListElement.mergeParameters(target.parameters, target, rawMetadata);

            target = new ScopeListElement(target, scope, parameters);
        }

        return target;
    }

    /**
     * Append scope/scopes to the current list
     *
     * @param scopeMetadataProvider
     * @param scope     a single scopeName or multiple scopeName seperated by space
     */
    public push(scopeMetadataProvider: ScopeMetadataProvider<T>, scope: string | undefined): ScopeListElement<T> {
        if (scope === null || scope === undefined) {
            // cannot push empty, return self
            return this;
        }

        if (scope.indexOf(" ") >= 0) {
            // there are multiple scopes to push
            return ScopeListElement._push(this, scopeMetadataProvider, scope.split(/ /g));
        }

        // there is a single scope to push
        return ScopeListElement._push(this, scopeMetadataProvider, [scope]);
    }

    private static _generateScopes<T extends IParameters = IParameters>(
        scopesList: ScopeListElement<T> | undefined,
    ): string[] {
        const result: string[] = [];
        let resultLen: number = 0;

        while (scopesList) {
            result[resultLen] = scopesList.scope;
            scopesList = scopesList.parent;
            resultLen += 1;
        }

        result.reverse();

        return result;
    }

    /**
     * Generate scopes of current list descending like:
     *    segment1.segment2.segment3
     *    segment1.segment2
     *    segment1
     */
    public generateScopes(): string[] {
        return ScopeListElement._generateScopes(this);
    }
}

export class StackElement<T extends IParameters = IParameters> {
    /**
     * Ad-hoc singleton NULL stack element
     */
    public static NULL: StackElement = new StackElement<IParameters>(
        undefined,
        { id: -1 } as PQP.Language.Ast.TNode,
        undefined as unknown as ScopeListElement,
    );
    /**
     * The previous state on the stack (or null for the root state).
     */
    public readonly parent?: StackElement<T>;
    /**
     * The depth of the stack.
     */
    public readonly depth: number;
    /**
     * pq ast nodes
     */
    public readonly nodeId: number;
    /**
     * The list of scopes containing the "nodeType" for this state.
     */
    public readonly scopeList: ScopeListElement<T>;

    constructor(parent: StackElement<T> | undefined, node: PQP.Language.Ast.TNode, scopeList: ScopeListElement<T>) {
        this.parent = parent;
        this.depth = this.parent ? this.parent.depth + 1 : 1;
        this.nodeId = node.id;
        this.scopeList = scopeList;
    }

    /**
     * A structural equals check. Does not take into account `scopes`.
     */
    private static _structuralEquals<T extends IParameters = IParameters>(
        l: StackElement<T>,
        r: StackElement<T>,
    ): boolean {
        let a: StackElement | undefined = l;
        let b: StackElement | undefined = r;

        do {
            if (a === b) {
                return true;
            }

            if (a.depth !== b.depth || a.nodeId !== b.nodeId) {
                return false;
            }

            // Go to previous pair
            a = a.parent;
            b = b.parent;

            // unsafe a, b might be null
            if (!a && !b) {
                // End of list reached for both
                return true;
            }

            if (!a || !b) {
                // End of list reached only for one
                return false;
            }
            // safe a, b cannot be null
            // eslint-disable-next-line no-constant-condition
        } while (true);
    }

    private static _equals<T extends IParameters = IParameters>(a: StackElement<T>, b: StackElement<T>): boolean {
        if (a === b) {
            return true;
        }

        return this._structuralEquals(a, b);
    }

    public clone(): StackElement<T> {
        return this;
    }

    public equals(other: StackElement<T>): boolean {
        if (!other) {
            return false;
        }

        return StackElement._equals(this, other);
    }

    public pop(): StackElement<T> {
        return PQP.Assert.asDefined(this.parent);
    }

    public safePop(): StackElement<T> {
        if (this.parent) {
            return this.parent;
        }

        return this;
    }

    public push(node: PQP.Language.Ast.TNode, scopeList?: ScopeListElement<T>): StackElement<T> {
        scopeList = scopeList ?? this.scopeList;

        return new StackElement(this, node, scopeList);
    }

    public hasSameNodeAs(other: PQP.Language.Ast.TNode): boolean {
        return this.nodeId === other.id;
    }
}
