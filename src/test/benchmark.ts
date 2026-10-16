// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import "mocha";
import * as Formatter from "../powerquery-formatter/format";
import * as PQP from "@microsoft/powerquery-parser";
import { join, resolve } from "node:path";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { Mock, mock } from "node:test";
import { spawnSync, SpawnSyncReturns } from "node:child_process";
import { expect } from "chai";
import { performance } from "node:perf_hooks";
import process from "node:process";
import { tmpdir } from "node:os";

import { BenchmarkConfig, parseConfig } from "../benchmark/config";
import {
    BenchmarkReport,
    FileReport,
    formatError,
    measureCommand,
    Measurement,
    PhaseTiming,
    runBenchmarks,
} from "../benchmark/benchmark";
import { FormatTraceConstant } from "../powerquery-formatter/trace";

type Sample = Measurement["samples"][number];

async function expectFailure(action: () => Promise<unknown>, message: string): Promise<void> {
    try {
        await action();
    } catch (error: unknown) {
        expect(formatError(error)).to.contain(message);

        return;
    }

    throw new Error(`Expected failure containing: ${message}`);
}

function okFile(report: BenchmarkReport, index: number = 0): Extract<FileReport, { status: "ok" }> {
    const file: FileReport = report.results[index];
    expect(file.status).to.equal("ok");

    if (file.status !== "ok") {
        throw new Error(file.error);
    }

    return file;
}

describe("formatter benchmark", () => {
    describe("configuration", () => {
        it("supplies defaults and accepts formatting settings", () => {
            const config: BenchmarkConfig = parseConfig({ files: [{ path: "query.pq" }] });
            expect(config.warmupRuns).to.equal(1);
            expect(config.measuredRuns).to.equal(10);
            expect(config.phaseTimings).to.equal(false);

            expect(config.settings).to.deep.equal({
                maxWidth: 120,
                indentationLiteral: "    ",
                newlineLiteral: "\r\n",
            });

            expect(
                parseConfig({
                    files: [{ path: "query.pq" }],
                    warmupRuns: 0,
                    measuredRuns: 1,
                    phaseTimings: true,
                    settings: { maxWidth: 40, indentationLiteral: "\t", newlineLiteral: "\n" },
                }).settings,
            ).to.deep.equal({ maxWidth: 40, indentationLiteral: "\t", newlineLiteral: "\n" });
        });

        for (const value of [
            null,
            [],
            {},
            { files: [] },
            { files: ["query.pq"] },
            { files: [{ path: " " }] },
            { files: [{ path: "query.pq", typo: true }] },
            { files: [{ path: "query.pq" }], typo: true },
            { files: [{ path: "query.pq" }], warmupRuns: -1 },
            { files: [{ path: "query.pq" }], measuredRuns: 0 },
            { files: [{ path: "query.pq" }], measuredRuns: 1.5 },
            { files: [{ path: "query.pq" }], measuredRuns: "5" },
            { files: [{ path: "query.pq" }], measuredRuns: null },
            { files: [{ path: "query.pq" }], measuredRuns: Infinity },
            { files: [{ path: "query.pq" }], measuredRuns: Number.MAX_SAFE_INTEGER },
            { files: [{ path: "query.pq" }], phaseTimings: "true" },
            { files: [{ path: "query.pq" }], phaseTimings: null },
            { files: [{ path: "query.pq" }], settings: null },
            { files: [{ path: "query.pq" }], settings: { typo: 1 } },
            { files: [{ path: "query.pq" }], settings: { maxWidth: 0 } },
            { files: [{ path: "query.pq" }], settings: { maxWidth: null } },
            { files: [{ path: "query.pq" }], settings: { indentationLiteral: "  " } },
            { files: [{ path: "query.pq" }], settings: { indentationLiteral: null } },
            { files: [{ path: "query.pq" }], settings: { newlineLiteral: "\r" } },
            { files: [{ path: "query.pq" }], settings: { newlineLiteral: null } },
        ]) {
            it(`rejects invalid payload ${JSON.stringify(value)}`, () => {
                expect(() => parseConfig(value)).to.throw();
            });
        }
    });

    it("measures only execution, with sample-derived statistics and fresh commands", async () => {
        let time: number = 0;
        let preparations: number = 0;
        let executions: number = 0;
        const clock: Mock<typeof performance.now> = mock.method(performance, "now", () => time);

        try {
            const measurement: Measurement = await measureCommand(
                () => {
                    preparations += 1;
                    time += 1000;
                    let executed: boolean = false;

                    return Promise.resolve({
                        run: (): Promise<Formatter.TriedFormat> => {
                            expect(executed).to.equal(false);
                            executed = true;
                            time += executions;
                            executions += 1;

                            return Promise.resolve(PQP.ResultUtils.ok("output"));
                        },
                    });
                },
                { warmupRuns: 1, measuredRuns: 4 },
            );

            expect([preparations, executions]).to.deep.equal([5, 5]);
            expect(measurement.warmupRuns).to.equal(1);
            expect(measurement.measuredRuns).to.equal(4);
            expect(measurement.durationMs).to.deep.equal({ average: 2.5, median: 2.5, minimum: 1, maximum: 4 });
            expect(clock.mock.callCount()).to.equal(8);
            expect(measurement.output.codeUnits).to.equal(6);
            expect(measurement.output.sha256).to.match(/^[a-f0-9]{64}$/);

            for (const sample of measurement.samples) {
                expect(sample.cpuUserMs).to.be.at.least(0);
                expect(sample.cpuSystemMs).to.be.at.least(0);

                expect(sample.memoryDeltaBytes.heapUsed).to.equal(
                    sample.memoryAfterBytes.heapUsed - sample.memoryBeforeBytes.heapUsed,
                );
            }

            expect(measurement.memoryDeltaBytes.heapUsed.average).to.equal(
                measurement.samples.reduce((sum: number, sample: Sample) => sum + sample.memoryDeltaBytes.heapUsed, 0) /
                    4,
            );
        } finally {
            clock.mock.restore();
        }
    });

    for (const failureRun of [1, 2]) {
        it(`rejects a failed warmup/sample at run ${failureRun}`, async () => {
            let runs: number = 0;

            await expectFailure(
                () =>
                    measureCommand(
                        () =>
                            Promise.resolve({
                                run: (): Promise<Formatter.TriedFormat> => {
                                    runs += 1;

                                    return runs === failureRun
                                        ? Promise.reject(new Error("format failed"))
                                        : Promise.resolve(PQP.ResultUtils.ok("output"));
                                },
                            }),
                        { warmupRuns: 1, measuredRuns: 2 },
                    ),
                "format failed",
            );

            expect(runs).to.equal(failureRun);
        });
    }

    it("rejects changed output rather than reporting timings for different results", async () => {
        let runs: number = 0;

        await expectFailure(
            () =>
                measureCommand(
                    () =>
                        Promise.resolve({
                            run: (): Promise<Formatter.TriedFormat> => {
                                runs += 1;

                                return Promise.resolve(PQP.ResultUtils.ok(String(runs)));
                            },
                        }),
                    { warmupRuns: 0, measuredRuns: 2 },
                ),
            "Formatted output changed",
        );
    });

    it("formats pre-parsed input without parsing again or mutating the AST", async () => {
        const text: string = "// comment\nlet x = [a = 1] in x";
        const expected: Formatter.TriedFormat = await Formatter.tryFormat(Formatter.DefaultSettings, text);
        const parsed: PQP.Task.TriedLexParseTask = await PQP.TaskUtils.tryLexParse(Formatter.DefaultSettings, text);
        PQP.TaskUtils.assertIsParseStageOk(parsed);
        const snapshot: string = JSON.stringify(parsed.ast);
        const parser: Mock<typeof PQP.TaskUtils.tryLexParse> = mock.method(PQP.TaskUtils, "tryLexParse");

        try {
            expect(await Formatter.tryFormatParsed(Formatter.DefaultSettings, text, parsed)).to.deep.equal(expected);
            expect(await Formatter.tryFormatParsed(Formatter.DefaultSettings, text, parsed)).to.deep.equal(expected);
            expect(parser.mock.callCount()).to.equal(0);
            expect(JSON.stringify(parsed.ast)).to.equal(snapshot);
        } finally {
            parser.mock.restore();
        }
    });

    describe("runner and CLI", () => {
        let directory: string;
        const repository: string = resolve(__dirname, "..", "..");

        beforeEach(async () => {
            directory = await mkdtemp(join(tmpdir(), "powerquery-formatter-benchmark-"));
            await writeFile(join(directory, "query.pq"), "\uFEFF// comment\nlet x = 1 in x", "utf8");
        });

        afterEach(async () => {
            await rm(directory, { recursive: true, force: true });
        });

        function cli(args: string[], input?: string): SpawnSyncReturns<string> {
            return spawnSync(
                process.execPath,
                [
                    "--expose-gc",
                    "--require",
                    join(repository, "node_modules", "ts-node", "register"),
                    join(repository, "src", "benchmark", "cli.ts"),
                    ...args,
                ],
                {
                    cwd: directory,
                    input,
                    encoding: "utf8",
                    timeout: 30000,
                    env: { ...process.env, TS_NODE_PROJECT: join(repository, "tsconfig.json") },
                },
            );
        }

        it("excludes parsing and keeps diagnostic tracing out of measured runs", async () => {
            let time: number = 0;
            const originalParse: typeof PQP.TaskUtils.tryLexParse = PQP.TaskUtils.tryLexParse;
            const originalFormat: typeof Formatter.tryFormatParsed = Formatter.tryFormatParsed;
            const clock: Mock<typeof performance.now> = mock.method(performance, "now", () => time);

            const parser: Mock<typeof PQP.TaskUtils.tryLexParse> = mock.method(
                PQP.TaskUtils,
                "tryLexParse",
                (...args: Parameters<typeof originalParse>) => {
                    time += 1000;
                    expect(args[0].traceManager).to.equal(Formatter.DefaultSettings.traceManager);

                    return originalParse(...args);
                },
            );

            const formatter: Mock<typeof Formatter.tryFormatParsed> = mock.method(
                Formatter,
                "tryFormatParsed",
                (...args: Parameters<typeof originalFormat>) => {
                    time += 7;

                    return originalFormat(...args);
                },
            );

            try {
                const report: BenchmarkReport = await runBenchmarks(
                    parseConfig({ files: [{ path: "query.pq" }], warmupRuns: 1, measuredRuns: 2, phaseTimings: true }),
                    directory,
                );

                const file: Extract<FileReport, { status: "ok" }> = okFile(report);
                expect(parser.mock.callCount()).to.equal(4);
                expect(formatter.mock.callCount()).to.equal(4);
                expect(file.measurement.durationMs).to.deep.equal({ average: 7, median: 7, minimum: 7, maximum: 7 });
                expect(file.measurement.samples).to.have.length(2);

                expect(
                    formatter.mock.calls
                        .slice(0, 3)
                        .every(
                            (call: typeof formatter.mock.calls[number]) =>
                                call.arguments[0].traceManager === Formatter.DefaultSettings.traceManager,
                        ),
                ).to.equal(true);

                expect(formatter.mock.calls[3].arguments[0].traceManager).not.to.equal(
                    Formatter.DefaultSettings.traceManager,
                );

                expect(file.phaseTimings?.map((span: PhaseTiming) => span.phase)).to.deep.equal([
                    FormatTraceConstant.PostParse,
                    FormatTraceConstant.Comment,
                    FormatTraceConstant.SerializeParameter,
                    FormatTraceConstant.PreProcessParameter,
                    FormatTraceConstant.Serialize,
                    FormatTraceConstant.LinearLengthCalculation,
                ]);

                expect(file.fileBytes).to.equal((await readFile(join(directory, "query.pq"))).length);
                expect(report.operationTiming).to.equal("formatting-only-fresh-parse-per-run");
                expect(report.phaseTiming).to.equal("separate-diagnostic-run");
            } finally {
                formatter.mock.restore();
                parser.mock.restore();
                clock.mock.restore();
            }
        });

        it("reports parse failures and continues with other files", async () => {
            await writeFile(join(directory, "invalid.pq"), "let x =", "utf8");

            const report: BenchmarkReport = await runBenchmarks(
                parseConfig({
                    files: [{ path: "invalid.pq" }, { path: "query.pq" }],
                    warmupRuns: 0,
                    measuredRuns: 1,
                }),
                directory,
            );

            expect(report.results[0].status).to.equal("error");
            expect(report.results[0]).not.to.have.property("measurement");
            expect(okFile(report, 1).measurement.samples).to.have.length(1);
            expect(okFile(report, 1).phaseTimings).to.equal(undefined);
        });

        it("preflights all paths before parsing or measuring", async () => {
            const parser: Mock<typeof PQP.TaskUtils.tryLexParse> = mock.method(PQP.TaskUtils, "tryLexParse");

            try {
                await expectFailure(
                    () =>
                        runBenchmarks(
                            parseConfig({ files: [{ path: "query.pq" }, { path: "missing.pq" }], measuredRuns: 1 }),
                            directory,
                        ),
                    "ENOENT",
                );

                expect(parser.mock.callCount()).to.equal(0);
            } finally {
                parser.mock.restore();
            }
        });

        it("supports payload-relative paths and stdin, preserves sources, and saves unique reports", async () => {
            const source: string = await readFile(join(directory, "query.pq"), "utf8");
            await mkdir(join(directory, "payloads"));

            await writeFile(
                join(directory, "payloads", "input.json"),
                `\uFEFF${JSON.stringify({
                    files: [{ path: join("..", "query.pq") }],
                    warmupRuns: 0,
                    measuredRuns: 1,
                })}`,
                "utf8",
            );

            const first: SpawnSyncReturns<string> = cli([join("payloads", "input.json")]);
            expect(first.status, first.stderr).to.equal(0);
            const firstReport: BenchmarkReport = JSON.parse(first.stdout);
            expect(okFile(firstReport).path).to.equal(join(directory, "query.pq"));
            expect(firstReport.environment.gcBeforeEachRun).to.equal(true);

            const second: SpawnSyncReturns<string> = cli(
                ["-"],
                JSON.stringify({ files: [{ path: "query.pq" }], warmupRuns: 0, measuredRuns: 1 }),
            );

            expect(second.status, second.stderr).to.equal(0);
            const secondReport: BenchmarkReport = JSON.parse(second.stdout);
            expect(okFile(secondReport).measurement.output).to.deep.equal(okFile(firstReport).measurement.output);
            expect(await readFile(join(directory, "query.pq"), "utf8")).to.equal(source);

            const folders: string[] = await readdir(join(directory, "benchmark-results"));
            expect(folders).to.have.length(2);

            const saved: string[] = await Promise.all(
                folders.map((folder: string) =>
                    readFile(join(directory, "benchmark-results", folder, "report.json"), "utf8"),
                ),
            );

            expect(saved).to.have.members([first.stdout, second.stdout]);

            const errors: string[] = await Promise.all(
                folders.map((folder: string) =>
                    readFile(join(directory, "benchmark-results", folder, "errors.log"), "utf8"),
                ),
            );

            expect(errors).to.deep.equal(["", ""]);
        }).timeout(60000);

        it("returns a nonzero exit and persists per-file failures", async () => {
            await writeFile(join(directory, "invalid.pq"), "let x =", "utf8");

            const result: SpawnSyncReturns<string> = cli(
                ["-"],
                JSON.stringify({
                    files: [{ path: "invalid.pq" }, { path: "query.pq" }],
                    warmupRuns: 0,
                    measuredRuns: 1,
                }),
            );

            expect(result.status, result.stderr).to.equal(1);
            const report: BenchmarkReport = JSON.parse(result.stdout);
            expect(report.results.map((file: FileReport) => file.status)).to.deep.equal(["error", "ok"]);
            const folders: string[] = await readdir(join(directory, "benchmark-results"));

            expect(await readFile(join(directory, "benchmark-results", folders[0], "errors.log"), "utf8")).to.contain(
                "invalid.pq",
            );
        }).timeout(60000);

        it("persists invalid payload errors without a report", async () => {
            const result: SpawnSyncReturns<string> = cli(["-"], '{"files":[]}');
            expect(result.status).to.equal(1);
            expect(result.stdout).to.equal("");
            expect(result.stderr).to.contain("files must be a non-empty array");
            const folders: string[] = await readdir(join(directory, "benchmark-results"));
            expect(await readdir(join(directory, "benchmark-results", folders[0]))).to.deep.equal(["errors.log"]);
        }).timeout(60000);

        it("reports log directory failures instead of silently losing results", async () => {
            await writeFile(join(directory, "benchmark-results"), "not a directory", "utf8");
            const result: SpawnSyncReturns<string> = cli(["-"], '{"files":[{"path":"query.pq"}],"measuredRuns":1}');
            expect(result.status).to.equal(1);
            expect(result.stdout).to.equal("");
            expect(result.stderr).to.contain("Benchmark failed:");
        }).timeout(60000);
    });
});
