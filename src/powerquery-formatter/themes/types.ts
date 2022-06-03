// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ThemeTrieElementRule } from "./themes";

export type IParameters = Record<string, unknown>;

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
     *      "scope1> scope2 scope3 scope4"
     */
    readonly scope?: string | ReadonlyArray<string>;
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
export interface IThemeProvider<T extends IParameters = IParameters> {
    readonly themeMatch: (scopeName: string) => ThemeTrieElementRule<T>[];
    readonly getDefaults: () => ThemeTrieElementRule<T>;
}

/**
 * Registry options
 */
export interface RegistryOptions<T extends IParameters = IParameters> {
    readonly theme: IRawTheme<T>;
    // we could add tracer over here if we want
}
