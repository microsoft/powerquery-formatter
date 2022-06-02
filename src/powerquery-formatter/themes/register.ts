// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { IRawTheme, IThemeProvider, RegistryOptions } from "./types";
import { Theme, ThemeTrieElementRule } from "./themes";

import { defaultTheme, SerializeParameterV2 } from "./constants";
import { ScopeMetadataProvider } from "./scopes";

const DEFAULT_OPTIONS: RegistryOptions<SerializeParameterV2> = {
    theme: defaultTheme,
};

export class SyncThemeRegistry implements IThemeProvider<SerializeParameterV2> {
    static defaultInstance: SyncThemeRegistry = new SyncThemeRegistry();

    private _theme: Theme;
    public readonly scopeMetaProvider: ScopeMetadataProvider;
    constructor(private readonly _option: RegistryOptions = DEFAULT_OPTIONS) {
        this._theme = Theme.createFromRawTheme(this._option.theme);
        this.scopeMetaProvider = new ScopeMetadataProvider(this);
    }

    /**
     * Update the theme
     * @param theme new theme
     */
    public setTheme(theme: IRawTheme<SerializeParameterV2>): void {
        this._theme = Theme.createFromRawTheme(theme);
        this.scopeMetaProvider.onDidChangeTheme();
    }

    /**
     * Get the default theme settings
     */
    public getDefaults(): ThemeTrieElementRule<SerializeParameterV2> {
        return this._theme.getDefaults();
    }

    /**
     * Match a scope in the theme.
     */
    public themeMatch(scopeName: string): ThemeTrieElementRule<SerializeParameterV2>[] {
        return this._theme.match(scopeName);
    }
}
