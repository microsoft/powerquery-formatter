// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ThemeTrieElementRule } from "./themes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IParameters = Record<string, any>;

/**
 * A single theme setting.
 */
export interface IRawThemeSetting<T extends IParameters = IParameters> {
    readonly name?: string;
    /**
     * hierarchic scope list seperated by comma like:
     *    eg:
     *      "scopeList1,scopeList2,scopeList3,scopeList4"
     *    or
     *      ["scopeList1", "scopeList2", "scopeList3", "scopeList4"]
     *
     * and one scopeList could also be consisted of multiple scopes seperated by space like:
     *    eg:
     *      "scope1 scope2 scope3 scope4"
     *    todo:
     *      consider "scope1> scope2 scope3 scope4"
     */
    readonly scope?: string | string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly parameters: T;
}

/**
 * A raw theme of multiple raw theme settings
 */
export interface IRawTheme<T extends IParameters = IParameters> {
    readonly name?: string;
    readonly settings: IRawThemeSetting<T>[];
}

/**
 * Theme provider
 */
export interface IThemeProvider {
    themeMatch(scopeName: string): ThemeTrieElementRule[];
    getDefaults(): ThemeTrieElementRule;
}

/**
 * Registry options
 */
export interface RegistryOptions<T extends IParameters = IParameters> {
    theme: IRawTheme<T>;
    // we could add tracer over here
}
