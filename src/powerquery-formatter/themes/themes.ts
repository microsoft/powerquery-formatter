import { IRawTheme, IRawThemeSetting } from "./types";
import { strArrCmp, strcmp } from "./utils";

/**
 * An initially parsed rule of a scopeList from raw theme
 *  a scope list would be like:
 *    "scope1 scope2 scope3 scope4"
 */
export class ParsedThemeRule {
    constructor(
        /**
         *  scope4 of a scope list: "scope1 scope2 scope3 scope4"
         */
        public readonly scope: string,
        /**
         *  ["scope3", "scope2", "scope1"] of a scope list: "scope1 scope2 scope3 scope4"
         */
        public readonly parentScopes: string[] | undefined,
        public readonly index: number,
        /**
         * parameters of the current parsed theme rule
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public readonly parameters?: Record<string, any>,
    ) {}
}

/**
 * Parse a raw theme into first-stage ParsedThemeRule.
 */
export function parseTheme(source?: IRawTheme): ParsedThemeRule[] {
    if (!source) {
        return [];
    }

    if (!source.settings || !Array.isArray(source.settings)) {
        return [];
    }

    const settings: IRawThemeSetting[] = source.settings;
    const result: ParsedThemeRule[] = [];
    let resultLen: number = 0;

    // eslint-disable-next-line no-plusplus
    for (let i: number = 0; i < settings.length; i++) {
        const entry: IRawThemeSetting = settings[i];

        if (!entry.parameters) {
            continue;
        }

        let scopes: string[];

        if (typeof entry.scope === "string") {
            let _scope: string = entry.scope;

            // remove leading commas
            _scope = _scope.replace(/^[,]+/, "");

            // remove trailing commans
            _scope = _scope.replace(/[,]+$/, "");

            scopes = _scope.split(",");
        } else if (Array.isArray(entry.scope)) {
            scopes = entry.scope;
        } else {
            scopes = [""];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parameters: Record<string, any> = {};

        if (Boolean(entry.parameters) && typeof entry.parameters === "object") {
            parameters = entry.parameters;
        }

        // eslint-disable-next-line no-plusplus
        for (let j: number = 0; j < scopes.length; j++) {
            const _scope: string = scopes[j].trim();

            const segments: string[] = _scope.split(" ");

            const scope: string = segments[segments.length - 1];
            let parentScopes: string[] | undefined = undefined;

            if (segments.length > 1) {
                parentScopes = segments.slice(0, segments.length - 1);
                parentScopes.reverse();
            }

            // eslint-disable-next-line no-plusplus
            result[resultLen++] = new ParsedThemeRule(scope, parentScopes, i, parameters);
        }
    }

    return result;
}

/**
 * Resolve rules (i.e. inheritance).
 */
function resolveParsedThemeRules(parsedThemeRules: ParsedThemeRule[]): Theme {
    // Sort rules lexicographically, and then by index if necessary
    parsedThemeRules.sort((a: ParsedThemeRule, b: ParsedThemeRule) => {
        let r: number = strcmp(a.scope, b.scope);

        if (r !== 0) {
            return r;
        }

        r = strArrCmp(a.parentScopes, b.parentScopes);

        if (r !== 0) {
            return r;
        }

        return a.index - b.index;
    });

    // Determine defaults
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let defaultParameters: Record<string, any> = {};

    // pop up any rules of empty scope names and apply them together
    while (parsedThemeRules.length >= 1 && parsedThemeRules[0].scope === "") {
        // parsedThemeRules must be non-empty thus it should shift over here
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const incomingDefaults: ParsedThemeRule = parsedThemeRules.shift()!;

        // no harm to be cautious, do not trust ts types as one this theme would be injected from clients
        if (incomingDefaults.parameters) {
            defaultParameters = {
                ...defaultParameters,
                ...incomingDefaults.parameters,
            };
        }
    }

    // create default tree element rule
    const defaults: ThemeTrieElementRule = new ThemeTrieElementRule(0, undefined, defaultParameters);

    // create tree root element
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const root: ThemeTrieElement = new ThemeTrieElement(new ThemeTrieElementRule(0, undefined, undefined as any), []);

    // append rules to the tree root
    parsedThemeRules.forEach((rule: ParsedThemeRule) => {
        root.insert(0, rule.scope, rule.parentScopes, rule.parameters);
    });

    return new Theme(defaults, root);
}

/**
 * Theme tree element's rule holding
 *    parent scopes
 *    customized parameters record
 */
export class ThemeTrieElementRule {
    constructor(
        public scopeDepth: number,
        public readonly parentScopes: string[] | undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public parameters?: Record<string, any>,
    ) {}

    public static cloneArr(arr: ThemeTrieElementRule[]): ThemeTrieElementRule[] {
        return arr.map((r: ThemeTrieElementRule) => r.clone());
    }

    // for copy assignment
    public clone(): ThemeTrieElementRule {
        return new ThemeTrieElementRule(this.scopeDepth, this.parentScopes, this.parameters);
    }

    public acceptOverwrite(
        scopeDepth: number,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parameters?: Record<string, any>,
    ): void {
        if (this.scopeDepth > scopeDepth) {
            // todo maybe have to gracefully handle this err, as it might be cx errors
            console.error("[ThemeTrieElementRule::acceptOverwrite] should never reach over here");
        } else {
            this.scopeDepth = scopeDepth;
        }

        // no harm to be safe over here
        if (parameters) {
            this.parameters = this.parameters ? { ...this.parameters, ...parameters } : { ...parameters };
        }
    }
}

/**
 * Theme tree element contains
 */
export class ThemeTrieElement {
    constructor(
        /**
         * Current rule of the element
         */
        private readonly _mainRule: ThemeTrieElementRule,
        /**
         * Other rules of sharing the same scope name of the element but bear with parent scopes
         */
        private readonly _rulesWithParentScopes: ThemeTrieElementRule[] = [],
        /**
         * Children rules beneath current element
         */
        private readonly _children: Map<string, ThemeTrieElement> = new Map(),
    ) {}

    private static _sortBySpecificity(arr: ThemeTrieElementRule[]): ThemeTrieElementRule[] {
        if (arr.length === 1) {
            return arr;
        }

        arr.sort(this._cmpBySpecificity);

        return arr;
    }

    private static _cmpBySpecificity(a: ThemeTrieElementRule, b: ThemeTrieElementRule): number {
        if (a.scopeDepth === b.scopeDepth) {
            const aParentScopes: string[] | undefined = a.parentScopes;
            const bParentScopes: string[] | undefined = b.parentScopes;
            const aParentScopesLen: number = !aParentScopes ? 0 : aParentScopes.length;
            const bParentScopesLen: number = !bParentScopes ? 0 : bParentScopes.length;

            if (aParentScopesLen === bParentScopesLen) {
                // eslint-disable-next-line no-plusplus
                for (let i: number = 0; i < aParentScopesLen; i++) {
                    // aParentScopes and bParentScopes cannot be empty as aParentScopesLen is larger than 0
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const aLen: number = aParentScopes![i].length;
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const bLen: number = bParentScopes![i].length;

                    if (aLen !== bLen) {
                        return bLen - aLen;
                    }
                }
            }

            return bParentScopesLen - aParentScopesLen;
        }

        return b.scopeDepth - a.scopeDepth;
    }

    private getScopeHeadTailPair(scope: string): [string, string] {
        const dotIndex: number = scope.indexOf(".");
        let head: string;
        let tail: string;

        if (dotIndex === -1) {
            head = scope;
            tail = "";
        } else {
            head = scope.substring(0, dotIndex);
            tail = scope.substring(dotIndex + 1);
        }

        return [head, tail];
    }

    public match(scope: string): ThemeTrieElementRule[] {
        if (scope === "") {
            // hit the tree rule of an empty scope name
            return ThemeTrieElement._sortBySpecificity(
                ([] as ThemeTrieElementRule[]).concat(this._mainRule).concat(this._rulesWithParentScopes),
            );
        }

        const [head, tail]: [string, string] = this.getScopeHeadTailPair(scope);

        if (this._children.has(head)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this._children.get(head)!.match(tail);
        }

        // return current rules which should be the mostly matched
        return ThemeTrieElement._sortBySpecificity(
            ([] as ThemeTrieElementRule[]).concat(this._mainRule).concat(this._rulesWithParentScopes),
        );
    }

    public insert(
        scopeDepth: number,
        scope: string,
        parentScopes: string[] | undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parameters?: Record<string, any>,
    ): void {
        if (scope === "") {
            this._doInsertHere(scopeDepth, parentScopes, parameters);

            return;
        }

        const [head, tail]: [string, string] = this.getScopeHeadTailPair(scope);

        let child: ThemeTrieElement;

        if (this._children.has(head)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            child = this._children.get(head)!;
        } else {
            child = new ThemeTrieElement(
                this._mainRule.clone(),
                ThemeTrieElementRule.cloneArr(this._rulesWithParentScopes),
            );

            this._children.set(head, child);
        }

        child.insert(scopeDepth + 1, tail, parentScopes, parameters);
    }

    private _doInsertHere(
        scopeDepth: number,
        parentScopes: string[] | undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parameters?: Record<string, any>,
    ): void {
        if (!parentScopes) {
            // merge into the main rule
            this._mainRule.acceptOverwrite(scopeDepth, parameters);

            return;
        }

        // try to merge into existing one rule w/ parent scopes
        // eslint-disable-next-line no-plusplus
        for (let i: number = 0; i < this._rulesWithParentScopes.length; i++) {
            const rule: ThemeTrieElementRule = this._rulesWithParentScopes[i];

            if (strArrCmp(rule.parentScopes, parentScopes) === 0) {
                // gotcha,  we gonna merge this into an existing one
                rule.acceptOverwrite(scopeDepth, parameters);

                return;
            }
        }

        // cannot find an existing rule w/ parent scopes
        this._rulesWithParentScopes.push(new ThemeTrieElementRule(scopeDepth, parentScopes, parameters));
    }
}

/**
 * Theme object supports style tokens
 */
export class Theme {
    public static createFromRawTheme(source?: IRawTheme): Theme {
        return this.createFromParsedTheme(parseTheme(source));
    }

    public static createFromParsedTheme(source: ParsedThemeRule[]): Theme {
        return resolveParsedThemeRules(source);
    }

    private readonly _cache: Map<string, ThemeTrieElementRule[]>;

    constructor(private readonly _defaults: ThemeTrieElementRule, private readonly _root: ThemeTrieElement) {
        this._cache = new Map();
    }

    public getDefaults(): ThemeTrieElementRule {
        return this._defaults;
    }

    /**
     * Find the array of matched rules for the scope name
     * @param scopeName: a string like "segment1.segment2.segment3"
     */
    public match(scopeName: string): ThemeTrieElementRule[] {
        if (!this._cache.has(scopeName)) {
            this._cache.set(scopeName, this._root.match(scopeName));
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this._cache.get(scopeName)!;
    }
}
