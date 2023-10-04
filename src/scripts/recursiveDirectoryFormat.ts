// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as fs from "fs";
import * as path from "path";
import { DefaultSettings, TriedFormat, tryFormat } from "../powerquery-formatter";
import { ResultUtils } from "@microsoft/powerquery-parser";

interface CliArgs {
    readonly allowedExtensions: ReadonlySet<string>;
    readonly rootDirectoryPath: string;
}

const DefaultCliArgs: Pick<CliArgs, "allowedExtensions"> = {
    allowedExtensions: new Set<string>([".mout"]),
};

function getPowerQueryFilePathsRecursively(
    directoryPath: string,
    allowedExtensions: ReadonlySet<string>,
): ReadonlyArray<string> {
    let files: ReadonlyArray<string> = getSubDirectoryPaths(directoryPath)
        // go through each directory
        .map((subDirectoryPath: string) => getPowerQueryFilePathsRecursively(subDirectoryPath, allowedExtensions))
        // map returns a 2d array (array of file arrays) so flatten
        .reduce((a: ReadonlyArray<string>, b: ReadonlyArray<string>) => a.concat(b), []);

    // Get files in directoryPath
    files = files.concat(getPowerQueryFilePaths(directoryPath, allowedExtensions));

    return files;
}

function readContents(filePath: string): string {
    // tslint:disable-next-line: non-literal-fs-path
    const contents: string = fs.readFileSync(filePath, "utf8");

    return contents.replace(/^\uFEFF/, "");
}

function writeContents(filePath: string, contents: string): void {
    const dirPath: string = path.dirname(filePath);

    // tslint:disable-next-line: non-literal-fs-path
    if (!fs.existsSync(dirPath)) {
        // tslint:disable-next-line: non-literal-fs-path
        fs.mkdirSync(dirPath, { recursive: true });
    }

    // tslint:disable-next-line: non-literal-fs-path
    fs.writeFileSync(filePath, contents, { encoding: "utf8" });
}

function isDirectory(path: string): boolean {
    // tslint:disable-next-line: non-literal-fs-path
    try {
        return fs.statSync(path).isDirectory();
    } catch {
        return false;
    }
}

function isFile(filePath: string): boolean {
    // tslint:disable-next-line: non-literal-fs-path
    return fs.statSync(filePath).isFile();
}

function isPowerQueryFile(filePath: string, allowedExtensions: ReadonlySet<string>): boolean {
    return isFile(filePath) && isPowerQueryExtension(path.extname(filePath), allowedExtensions);
}

function isPowerQueryExtension(extension: string, allowedExtensions: ReadonlySet<string>): boolean {
    return allowedExtensions.has(extension);
}

function getSubDirectoryPaths(rootDirectory: string): ReadonlyArray<string> {
    // tslint:disable-next-line: non-literal-fs-path
    return (
        fs
            // tslint:disable-next-line: non-literal-fs-path
            .readdirSync(rootDirectory)
            .map((name: string) => path.join(rootDirectory, name))
            .filter(isDirectory)
    );
}

function getPowerQueryFilePaths(filePath: string, allowedExtensions: ReadonlySet<string>): ReadonlyArray<string> {
    // tslint:disable-next-line: non-literal-fs-path
    return (
        fs
            // tslint:disable-next-line: non-literal-fs-path
            .readdirSync(filePath)
            .map((name: string) => path.join(filePath, name))
            .filter((filePath: string) => isPowerQueryFile(filePath, allowedExtensions))
    );
}

function printText(text: string): void {
    if (process.stdout.isTTY) {
        process.stdout.write(text);
    } else {
        // Remove trailing newline as console.log already adds one.
        console.log(text.replace(/\n$/, ""));
    }
}

function getCliArgs(): CliArgs {
    const args: ReadonlyArray<string> = process.argv;

    if (args.length <= 2) {
        const errorMessage: string =
            "No arguments provided. Expecting a directory path and optionally a CSV of extensions to format. Aborting.\n";

        printText(errorMessage);
        throw new Error(errorMessage);
    }

    if (args.length === 3) {
        const allowedExtensions: ReadonlySet<string> = DefaultCliArgs.allowedExtensions;

        printText(
            `No argument given for allowed extensions. Defaulting to [${Array.from(allowedExtensions).join(", ")}].\n`,
        );

        return {
            allowedExtensions,
            rootDirectoryPath: validateDirectoryGetArg(args[2]),
        };
    }

    if (args.length === 4) {
        return {
            allowedExtensions: validateExtensionsGetArg(args[3]),
            rootDirectoryPath: validateDirectoryGetArg(args[2]),
        };
    }

    const errorMessage: string = "Too many arguments provided. Aborting.\n";
    printText(errorMessage);
    throw new Error(errorMessage);
}

function validateDirectoryGetArg(potentialDirectoryPath: string | undefined): string {
    if (!potentialDirectoryPath || !isDirectory(potentialDirectoryPath)) {
        const errorMessage: string = `Provided argument is not a directory path: "${potentialDirectoryPath}". Aborting.\n`;
        printText(errorMessage);
        throw new Error(errorMessage);
    }

    return potentialDirectoryPath;
}

function validateExtensionsGetArg(potentialExtensions: string | undefined): ReadonlySet<string> {
    const result: Set<string> = new Set<string>();

    for (const potentialExtension of potentialExtensions?.split(",") ?? []) {
        if (!potentialExtension.startsWith(".")) {
            const errorMessage: string = `Provided extension is not valid: "${potentialExtension}", expecting a CSV such as ".pq,.mout" Aborting.\n`;
            printText(errorMessage);
            throw new Error(errorMessage);
        }

        result.add(potentialExtension);
    }

    return result;
}

async function main(): Promise<void> {
    const { allowedExtensions, rootDirectoryPath }: CliArgs = getCliArgs();

    const powerQueryFilePaths: ReadonlyArray<string> = getPowerQueryFilePathsRecursively(
        rootDirectoryPath,
        allowedExtensions,
    );

    if (powerQueryFilePaths.length === 0) {
        printText(`No files found with extensions [${Array.from(allowedExtensions).join(", ")}].\n`);

        return;
    }

    for (const filePath of powerQueryFilePaths) {
        // eslint-disable-next-line no-await-in-loop
        const triedFormat: TriedFormat = await tryFormat(DefaultSettings, readContents(filePath));

        if (ResultUtils.isOk(triedFormat)) {
            printText(`Formatted "${filePath}" successfully\n`);
            writeContents(filePath, triedFormat.value);
        } else {
            printText(`Failed to format "${filePath}":\n`);
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async (): Promise<void> => {
    void (await main());
})();
