// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { DefaultSettings, FormatSettings, IndentationLiteral, NewlineLiteral } from "../powerquery-formatter";

export interface BenchmarkConfig {
    readonly files: ReadonlyArray<{ readonly path: string }>;
    readonly warmupRuns: number;
    readonly measuredRuns: number;
    readonly phaseTimings: boolean;
    readonly settings: Pick<FormatSettings, "maxWidth" | "indentationLiteral" | "newlineLiteral">;
}

export function parseConfig(value: unknown): BenchmarkConfig {
    const config: Record<string, unknown> = object(value, "payload");
    checkKeys(config, ["files", "warmupRuns", "measuredRuns", "phaseTimings", "settings"], "payload");

    if (!Array.isArray(config.files) || config.files.length === 0) {
        throw new Error("files must be a non-empty array");
    }

    const files: BenchmarkConfig["files"] = config.files.map((entry: unknown, index: number) => {
        const label: string = `files[${index}]`;
        const file: Record<string, unknown> = object(entry, label);
        checkKeys(file, ["path"], label);

        if (typeof file.path !== "string" || file.path.trim().length === 0) {
            throw new Error(`${label}.path must be a non-empty string`);
        }

        return { path: file.path };
    });

    const warmupRuns: number = integer(config.warmupRuns, 1, 0, "warmupRuns");
    const measuredRuns: number = integer(config.measuredRuns, 10, 1, "measuredRuns");

    if (!Number.isSafeInteger(warmupRuns + measuredRuns)) {
        throw new Error("warmupRuns + measuredRuns must be a safe integer");
    }

    if (config.phaseTimings !== undefined && typeof config.phaseTimings !== "boolean") {
        throw new Error("phaseTimings must be a boolean");
    }

    const settings: Record<string, unknown> = config.settings === undefined ? {} : object(config.settings, "settings");

    checkKeys(settings, ["maxWidth", "indentationLiteral", "newlineLiteral"], "settings");

    const indentationLiteral: unknown =
        settings.indentationLiteral === undefined ? DefaultSettings.indentationLiteral : settings.indentationLiteral;

    const newlineLiteral: unknown =
        settings.newlineLiteral === undefined ? DefaultSettings.newlineLiteral : settings.newlineLiteral;

    if (indentationLiteral !== IndentationLiteral.SpaceX4 && indentationLiteral !== IndentationLiteral.Tab) {
        throw new Error('settings.indentationLiteral must be four spaces or "\\t"');
    }

    if (newlineLiteral !== NewlineLiteral.Unix && newlineLiteral !== NewlineLiteral.Windows) {
        throw new Error('settings.newlineLiteral must be "\\n" or "\\r\\n"');
    }

    return {
        files,
        warmupRuns,
        measuredRuns,
        phaseTimings: config.phaseTimings ?? false,
        settings: {
            maxWidth: integer(settings.maxWidth, DefaultSettings.maxWidth, 1, "settings.maxWidth"),
            indentationLiteral,
            newlineLiteral,
        },
    };
}

function integer(value: unknown, defaultValue: number, minimum: number, label: string): number {
    if (value === undefined) {
        return defaultValue;
    }

    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) {
        throw new Error(`${label} must be a safe integer >= ${minimum}`);
    }

    return value;
}

function object(value: unknown, label: string): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new Error(`${label} must be an object`);
    }

    return value as Record<string, unknown>;
}

function checkKeys(value: Record<string, unknown>, allowed: ReadonlyArray<string>, label: string): void {
    for (const key of Object.keys(value)) {
        if (!allowed.includes(key)) {
            throw new Error(`${label}: unknown property ${key}`);
        }
    }
}
