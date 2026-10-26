// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { appendFile, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

import { BenchmarkConfig, parseConfig } from "./config";
import { BenchmarkReport, FileReport, formatError, runBenchmarks } from "./benchmark";

async function main(): Promise<void> {
    const logsRoot: string = resolve("benchmark-results");
    await mkdir(logsRoot, { recursive: true });

    const timestamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const logsDirectory: string = await mkdtemp(join(logsRoot, `${timestamp}-`));
    process.stderr.write(`Benchmark logs: ${logsDirectory}\n`);

    try {
        await run(logsDirectory);
    } catch (error: unknown) {
        const message: string = `Benchmark failed: ${formatError(error)}\n`;
        process.stderr.write(message);
        process.exitCode = 1;
        await appendFile(join(logsDirectory, "errors.log"), message, "utf8");
    }
}

async function run(logsDirectory: string): Promise<void> {
    const args: string[] = process.argv.slice(2);

    if (args.length !== 1) {
        throw new Error("Usage: npm run --silent benchmark -- <payload.json | ->");
    }

    const input: string = args[0];
    let json: string;

    if (input === "-") {
        process.stdin.setEncoding("utf8");
        json = "";

        for await (const chunk of process.stdin) {
            json += chunk;
        }
    } else {
        json = await readFile(input, "utf8");
    }

    const config: BenchmarkConfig = parseConfig(JSON.parse(json.replace(/^\uFEFF/, "")));

    const report: BenchmarkReport = await runBenchmarks(
        config,
        input === "-" ? process.cwd() : dirname(resolve(input)),
    );

    const output: string = `${JSON.stringify(report, undefined, 2)}\n`;
    const errors: ReadonlyArray<FileReport> = report.results.filter((result: FileReport) => result.status === "error");

    process.stdout.write(output);

    if (errors.length) {
        process.exitCode = 1;
    }

    await writeFile(join(logsDirectory, "report.json"), output, "utf8");

    await writeFile(
        join(logsDirectory, "errors.log"),
        errors
            .map((result: FileReport) => (result.status === "error" ? `${result.path}: ${result.error}\n` : ""))
            .join(""),
        "utf8",
    );
}

main().catch((error: unknown) => {
    process.stderr.write(`Benchmark failed: ${formatError(error)}\n`);
    process.exitCode = 1;
});
