// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as PQP from "@microsoft/powerquery-parser";
import { Buffer } from "node:buffer";
import { cpus } from "node:os";
import { createHash } from "node:crypto";
import { inspect } from "node:util";
import { performance } from "node:perf_hooks";
import process from "node:process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { DefaultSettings, FormatSettings, TriedFormat, tryFormatParsed } from "../powerquery-formatter";
import { BenchmarkConfig } from "./config";
import { FormatTraceConstant } from "../powerquery-formatter/trace";

export interface Statistics {
    readonly average: number;
    readonly median: number;
    readonly minimum: number;
    readonly maximum: number;
}

interface OutputSummary {
    readonly codeUnits: number;
    readonly sha256: string;
}

interface Sample {
    readonly durationMs: number;
    readonly cpuUserMs: number;
    readonly cpuSystemMs: number;
    readonly memoryBeforeBytes: NodeJS.MemoryUsage;
    readonly memoryAfterBytes: NodeJS.MemoryUsage;
    readonly memoryDeltaBytes: NodeJS.MemoryUsage;
}

export interface Measurement {
    readonly warmupRuns: number;
    readonly measuredRuns: number;
    readonly durationMs: Statistics;
    readonly cpuUserMs: Statistics;
    readonly cpuSystemMs: Statistics;
    readonly memoryDeltaBytes: Record<keyof NodeJS.MemoryUsage, Statistics>;
    readonly output: OutputSummary;
    readonly samples: ReadonlyArray<Sample>;
}

export interface PhaseTiming {
    readonly phase: string;
    readonly task: string;
    readonly id: number;
    readonly correlationId: number | undefined;
    readonly durationMs: number;
    readonly details: object | undefined;
}

export type FileReport = {
    readonly path: string;
    readonly fileBytes: number;
    readonly sourceSha256: string;
} & (
    | {
          readonly status: "ok";
          readonly measurement: Measurement;
          readonly phaseTimings?: ReadonlyArray<PhaseTiming>;
      }
    | { readonly status: "error"; readonly error: string }
);

export interface BenchmarkReport {
    readonly schemaVersion: 1;
    readonly environment: {
        readonly node: string;
        readonly platform: string;
        readonly architecture: string;
        readonly cpu: string | undefined;
        readonly gcBeforeEachRun: boolean;
    };
    readonly config: BenchmarkConfig;
    readonly operationTiming: "formatting-only-fresh-parse-per-run";
    readonly phaseTiming: "separate-diagnostic-run" | "disabled";
    readonly results: ReadonlyArray<FileReport>;
}

export interface PreparedCommand {
    run(): Promise<TriedFormat>;
}

export async function measureCommand(
    prepare: () => Promise<PreparedCommand>,
    config: Pick<BenchmarkConfig, "warmupRuns" | "measuredRuns">,
): Promise<Measurement> {
    const samples: Sample[] = [];
    let output: OutputSummary | undefined;

    for (let iteration: number = 0; iteration < config.warmupRuns + config.measuredRuns; iteration += 1) {
        // Preparation and collection must finish before timing this sample.
        // eslint-disable-next-line no-await-in-loop
        const command: PreparedCommand = await prepare();
        globalThis.gc?.();

        if (iteration < config.warmupRuns) {
            // eslint-disable-next-line no-await-in-loop
            const result: TriedFormat = await command.run();
            output = checkOutput(PQP.ResultUtils.assertOk(result), output);

            continue;
        }

        const memoryBeforeBytes: NodeJS.MemoryUsage = process.memoryUsage();
        const cpuBefore: NodeJS.CpuUsage = process.cpuUsage();
        const start: number = performance.now();
        // eslint-disable-next-line no-await-in-loop
        const result: TriedFormat = await command.run();
        const durationMs: number = performance.now() - start;
        const cpu: NodeJS.CpuUsage = process.cpuUsage(cpuBefore);
        const memoryAfterBytes: NodeJS.MemoryUsage = process.memoryUsage();

        output = checkOutput(PQP.ResultUtils.assertOk(result), output);

        samples.push({
            durationMs,
            cpuUserMs: cpu.user / 1000,
            cpuSystemMs: cpu.system / 1000,
            memoryBeforeBytes,
            memoryAfterBytes,
            memoryDeltaBytes: {
                rss: memoryAfterBytes.rss - memoryBeforeBytes.rss,
                heapUsed: memoryAfterBytes.heapUsed - memoryBeforeBytes.heapUsed,
                heapTotal: memoryAfterBytes.heapTotal - memoryBeforeBytes.heapTotal,
                external: memoryAfterBytes.external - memoryBeforeBytes.external,
                arrayBuffers: memoryAfterBytes.arrayBuffers - memoryBeforeBytes.arrayBuffers,
            },
        });
    }

    return {
        warmupRuns: config.warmupRuns,
        measuredRuns: samples.length,
        durationMs: statistics(samples.map((sample: Sample) => sample.durationMs)),
        cpuUserMs: statistics(samples.map((sample: Sample) => sample.cpuUserMs)),
        cpuSystemMs: statistics(samples.map((sample: Sample) => sample.cpuSystemMs)),
        memoryDeltaBytes: {
            rss: memoryStatistics(samples, "rss"),
            heapUsed: memoryStatistics(samples, "heapUsed"),
            heapTotal: memoryStatistics(samples, "heapTotal"),
            external: memoryStatistics(samples, "external"),
            arrayBuffers: memoryStatistics(samples, "arrayBuffers"),
        },
        output: PQP.Assert.asDefined(output),
        samples,
    };
}

export async function runBenchmarks(config: BenchmarkConfig, baseDirectory: string): Promise<BenchmarkReport> {
    const settings: FormatSettings = { ...DefaultSettings, ...config.settings };
    const files: { path: string; text: string; fileBytes: number; sourceSha256: string }[] = [];

    // Preflight file I/O before measuring any commands.
    for (const file of config.files) {
        const path: string = resolve(baseDirectory, file.path);
        // eslint-disable-next-line no-await-in-loop
        const content: Buffer = await readFile(path);

        files.push({
            path,
            text: content.toString("utf8").replace(/^\uFEFF/, ""),
            fileBytes: content.length,
            sourceSha256: hash(content),
        });
    }

    const results: FileReport[] = [];

    for (const file of files) {
        const identity: Pick<FileReport, "path" | "fileBytes" | "sourceSha256"> = {
            path: file.path,
            fileBytes: file.fileBytes,
            sourceSha256: file.sourceSha256,
        };

        try {
            // Every sample has fresh parse state; no formatter or parser calls are monkey-patched.
            // eslint-disable-next-line no-await-in-loop
            const measurement: Measurement = await measureCommand(() => prepareFormat(settings, file.text), config);
            let phaseTimings: ReadonlyArray<PhaseTiming> | undefined;

            if (config.phaseTimings) {
                // Parse without tracing, then instrument a separate formatting run.
                // eslint-disable-next-line no-await-in-loop
                const parsed: PQP.Task.ParseTaskOk = await parse(settings, file.text);
                const traceManager: PhaseTraceManager = new PhaseTraceManager();
                globalThis.gc?.();
                // eslint-disable-next-line no-await-in-loop
                const result: TriedFormat = await tryFormatParsed({ ...settings, traceManager }, file.text, parsed);
                checkOutput(PQP.ResultUtils.assertOk(result), measurement.output);
                phaseTimings = traceManager.timings.sort((left: PhaseTiming, right: PhaseTiming) => left.id - right.id);
            }

            results.push({ ...identity, status: "ok", measurement, phaseTimings });
        } catch (error: unknown) {
            results.push({ ...identity, status: "error", error: formatError(error) });
        }
    }

    return {
        schemaVersion: 1,
        environment: {
            node: process.version,
            platform: process.platform,
            architecture: process.arch,
            cpu: cpus()[0]?.model,
            gcBeforeEachRun: globalThis.gc !== undefined,
        },
        config,
        operationTiming: "formatting-only-fresh-parse-per-run",
        phaseTiming: config.phaseTimings ? "separate-diagnostic-run" : "disabled",
        results,
    };
}

export function formatError(error: unknown): string {
    if (error !== null && typeof error === "object" && "message" in error && typeof error.message === "string") {
        return error.message;
    }

    return inspect(error, { depth: 2 });
}

async function parse(settings: FormatSettings, text: string): Promise<PQP.Task.ParseTaskOk> {
    const parsed: PQP.Task.TriedLexParseTask = await PQP.TaskUtils.tryLexParse(settings, text);

    if (PQP.TaskUtils.isError(parsed)) {
        throw parsed.error;
    }

    return parsed;
}

async function prepareFormat(settings: FormatSettings, text: string): Promise<PreparedCommand> {
    const parsed: PQP.Task.ParseTaskOk = await parse(settings, text);

    return { run: (): Promise<TriedFormat> => tryFormatParsed(settings, text, parsed) };
}

function hash(data: string | Buffer): string {
    return createHash("sha256").update(data).digest("hex");
}

function checkOutput(text: string, expected: OutputSummary | undefined): OutputSummary {
    const output: OutputSummary = { codeUnits: text.length, sha256: hash(text) };

    if (expected && (expected.codeUnits !== output.codeUnits || expected.sha256 !== output.sha256)) {
        throw new Error("Formatted output changed between benchmark runs");
    }

    return output;
}

function statistics(values: ReadonlyArray<number>): Statistics {
    PQP.Assert.isTrue(values.length > 0, "Statistics require at least one sample");
    const sorted: number[] = [...values].sort((left: number, right: number) => left - right);
    const middle: number = Math.floor(sorted.length / 2);

    return {
        average: values.reduce((sum: number, value: number) => sum + value, 0) / values.length,
        median: sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle],
        minimum: sorted[0],
        maximum: sorted[sorted.length - 1],
    };
}

function memoryStatistics(samples: ReadonlyArray<Sample>, key: keyof NodeJS.MemoryUsage): Statistics {
    return statistics(samples.map((sample: Sample) => sample.memoryDeltaBytes[key]));
}

const phases: ReadonlySet<string> = new Set([
    FormatTraceConstant.PostParse,
    FormatTraceConstant.Comment,
    FormatTraceConstant.SerializeParameter,
    FormatTraceConstant.PreProcessParameter,
    FormatTraceConstant.Serialize,
    FormatTraceConstant.LinearLengthCalculation,
]);

class PhaseTraceManager extends PQP.Trace.TraceManager {
    public readonly timings: PhaseTiming[] = [];
    private readonly starts: Map<number, { readonly time: number; readonly details: object | undefined }> = new Map();

    protected override trace(
        phase: string,
        task: string,
        correlationId: number | undefined,
        details?: object,
    ): PQP.Trace.Trace {
        return phases.has(phase) ? super.trace(phase, task, correlationId, details) : PQP.Trace.NoOpTraceInstance;
    }

    public override emit(trace: PQP.Trace.Trace, message: string, details?: object): void {
        if (message === PQP.Trace.TraceConstant.Entry) {
            this.starts.set(trace.id, { time: performance.now(), details });
        } else if (message === PQP.Trace.TraceConstant.Exit) {
            const start: { readonly time: number; readonly details: object | undefined } = PQP.Assert.asDefined(
                this.starts.get(trace.id),
            );

            this.timings.push({
                phase: trace.phase,
                task: trace.task,
                id: trace.id,
                correlationId: trace.correlationId,
                durationMs: performance.now() - start.time,
                details: start.details,
            });

            this.starts.delete(trace.id);
        }
    }
}
