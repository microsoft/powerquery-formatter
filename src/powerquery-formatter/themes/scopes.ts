import { Ast } from "@microsoft/powerquery-parser/lib/powerquery-parser/language";
import { IThemeProvider } from "./types";
import { ThemeTrieElementRule } from "./themes";

/**
 * The metadata containing the scopeName and matched theme rules of a scope name
 */
export class ScopeMetadata {
    constructor(public readonly scopeName: string, public readonly themeData: ThemeTrieElementRule[]) {}
}

export class ScopeMetadataProvider {
    private static _NULL_SCOPE_METADATA: ScopeMetadata = new ScopeMetadata("", []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _cache: Map<string, ScopeMetadata> = undefined as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _defaultMetaData: ScopeMetadata = undefined as any;

    private _doGetMetadataForScope(scopeName: string): ScopeMetadata {
        const themeData: ThemeTrieElementRule[] = this._themeProvider.themeMatch(scopeName);

        return new ScopeMetadata(scopeName, themeData);
    }
    public getMetadataForScope(scopeName: string | undefined): ScopeMetadata {
        // never hurts to be too careful
        if (scopeName === null || scopeName === undefined) {
            return ScopeMetadataProvider._NULL_SCOPE_METADATA;
        }

        let value: ScopeMetadata | undefined = this._cache.get(scopeName);

        if (value) {
            return value;
        }

        value = this._doGetMetadataForScope(scopeName);
        this._cache.set(scopeName, value);

        return value;
    }

    constructor(private readonly _themeProvider: IThemeProvider) {
        this.onDidChangeTheme();
    }
    public onDidChangeTheme(): void {
        this._cache = new Map();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._defaultMetaData = new ScopeMetadata("", [this._themeProvider.getDefaults()]) as any;
    }

    public getDefaultMetadata(): ScopeMetadata {
        return this._defaultMetaData;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ScopeListElementParameters = Record<string, any>;
export const EmptyScopeListElementParameters: ScopeListElementParameters = {};

/**
 * Immutable scope list element
 */
export class ScopeListElement {
    constructor(
        public readonly parent: ScopeListElement | undefined,
        public readonly scope: string,
        public readonly parameters: ScopeListElementParameters,
    ) {}

    private static _equals(a: ScopeListElement, b: ScopeListElement): boolean {
        do {
            if (a === b) {
                return true;
            }

            if (a.scope !== b.scope) {
                return false;
            }

            // Go to previous pair
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            a = a.parent as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            b = b.parent as any;

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

    public equals(other: ScopeListElement): boolean {
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

    private static _matches(target: ScopeListElement | undefined, parentScopes: string[] | undefined): boolean {
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
    public static mergeParameters(
        parameters: ScopeListElementParameters,
        scopesList: ScopeListElement | undefined,
        source: ScopeMetadata | undefined,
    ): ScopeListElementParameters {
        if (!source) {
            return parameters;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let assignedParameters: Record<string, any> | undefined = undefined;

        if (source.themeData) {
            // Find the first themeData that matches
            // eslint-disable-next-line no-plusplus
            for (let i: number = 0; i < source.themeData.length; i++) {
                const themeData: ThemeTrieElementRule = source.themeData[i];

                if (this._matches(scopesList, themeData.parentScopes)) {
                    assignedParameters = themeData.parameters;
                    break;
                }
            }
        }

        return assignedParameters ?? EmptyScopeListElementParameters;
    }
    private static _push(
        target: ScopeListElement,
        scopeMetadataProvider: ScopeMetadataProvider,
        scopes: string[],
    ): ScopeListElement {
        // eslint-disable-next-line no-plusplus
        for (let i: number = 0; i < scopes.length; i++) {
            const scope: string = scopes[i];
            const rawMetadata: ScopeMetadata = scopeMetadataProvider.getMetadataForScope(scope);

            const parameters: ScopeListElementParameters = ScopeListElement.mergeParameters(
                target.parameters,
                target,
                rawMetadata,
            );

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
    public push(scopeMetadataProvider: ScopeMetadataProvider, scope: string | undefined): ScopeListElement {
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

    private static _generateScopes(scopesList: ScopeListElement | undefined): string[] {
        const result: string[] = [];
        let resultLen: number = 0;

        while (scopesList) {
            // eslint-disable-next-line no-plusplus
            result[resultLen++] = scopesList.scope;
            scopesList = scopesList.parent;
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

export class StackElement {
    /**
     * Ad-hoc singleton NULL stack element
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static NULL: StackElement = new StackElement(undefined, { id: -1 } as any, undefined as any);
    /**
     * The previous state on the stack (or null for the root state).
     */
    public readonly parent?: StackElement;
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
    public readonly scopeList: ScopeListElement;

    constructor(parent: StackElement | undefined, node: Ast.TNode, scopeList: ScopeListElement) {
        this.parent = parent;
        this.depth = this.parent ? this.parent.depth + 1 : 1;
        this.nodeId = node.id;
        this.scopeList = scopeList;
    }

    /**
     * A structural equals check. Does not take into account `scopes`.
     */
    private static _structuralEquals(a: StackElement, b: StackElement): boolean {
        do {
            if (a === b) {
                return true;
            }

            if (a.depth !== b.depth || a.nodeId !== b.nodeId) {
                return false;
            }

            // Go to previous pair
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            a = a.parent as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            b = b.parent as any;

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

    private static _equals(a: StackElement, b: StackElement): boolean {
        if (a === b) {
            return true;
        }

        return this._structuralEquals(a, b);
    }

    public clone(): StackElement {
        return this;
    }

    public equals(other: StackElement): boolean {
        if (!other) {
            return false;
        }

        return StackElement._equals(this, other);
    }

    public pop(): StackElement {
        // cannot pop root stack
        // todo make a handled assertion over here
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.parent!;
    }

    public safePop(): StackElement {
        if (this.parent) {
            return this.parent;
        }

        return this;
    }

    public push(node: Ast.TNode, scopeList?: ScopeListElement): StackElement {
        scopeList = scopeList ?? this.scopeList;

        return new StackElement(this, node, scopeList);
    }

    public hasSameNodeAs(other: Ast.TNode): boolean {
        return this.nodeId === other.id;
    }
}
