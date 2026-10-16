# powerquery-formatter

[![Build Status](https://dev.azure.com/ms/powerquery-formatter/_apis/build/status/Microsoft.powerquery-formatter?branchName=master)](https://dev.azure.com/ms/powerquery-formatter/_build/latest?definitionId=343&branchName=master)

A TypeScript library for formatting Power Query / M expressions and section documents. It uses
`@microsoft/powerquery-parser` to understand syntax, applies formatting rules, and returns the complete
formatted source with a terminating newline. It handles comments but does not evaluate M code.

For the implementation, data flow, extension points, and performance tooling, see
[ARCHITECTURE.md](ARCHITECTURE.md).

## Install

Requires **Node.js 22 or later**. The example below uses the parser's result helpers alongside the formatter:

```powershell
npm install @microsoft/powerquery-formatter @microsoft/powerquery-parser
```

## Format a query

```ts
import { ResultUtils } from "@microsoft/powerquery-parser";
import { DefaultSettings, NewlineLiteral, tryFormat } from "@microsoft/powerquery-formatter";

export async function formatQuery(text: string): Promise<string> {
    const result = await tryFormat(
        {
            ...DefaultSettings,
            maxWidth: 120,
            newlineLiteral: NewlineLiteral.Unix,
        },
        text,
    );

    if (ResultUtils.isError(result)) {
        throw result.error;
    }

    return result.value;
}
```

Call `formatQuery` with M source, such as `"let x=1 in x"`. The library returns text; it does not read
or write files. Check the result for lexical, parse, or formatter errors rather than assuming success.

### Settings and entry points

Start with `DefaultSettings` and override the fields you need:

| Setting | Default | Meaning |
| --- | --- | --- |
| `maxWidth` | `120` | Width heuristic for choosing inline versus block layout, not a strict line-length limit. |
| `indentationLiteral` | `IndentationLiteral.SpaceX4` | Four spaces; `IndentationLiteral.Tab` selects a tab. |
| `newlineLiteral` | `NewlineLiteral.Windows` | CRLF; `NewlineLiteral.Unix` selects LF for generated line breaks. |

`FormatSettings` also includes parser settings, locale, tracing, and cooperative cancellation settings.
See [error and cancellation behavior](ARCHITECTURE.md#errors-and-cancellation) before relying on cancellation.

| API | Use |
| --- | --- |
| `tryFormat(settings, text)` | Normal entry point: lex, parse, and format. |
| `tryFormatParsed(settings, text, parsed)` | Format an existing successful `TaskUtils.tryLexParse` result without parsing again. Supply the exact original text used for that parse. |
| `trySerialize(settings)` | Low-level entry point for callers that already have an AST, node maps, and prepared comment/formatting parameters. |

The APIs are asynchronous and return parser-library `Result` values. See
[API boundaries](ARCHITECTURE.md#api-boundaries) for the prepared-input contracts.

## Develop

From a checkout:

```powershell
npm ci
npm run build
npm run lint
npm test
```

The repository's build scripts and CI are Windows-oriented. `npm run watch` recompiles on changes.
Build output goes to `lib`; published library entry points and source organization are described in
the [architecture guide](ARCHITECTURE.md#source-layout-and-packaging).

### Format files in place

The checkout includes a recursive formatting script:

```powershell
npm run script:recursiveDirectoryFormat -- .\queries ".pq,.mout"
```

**This overwrites successfully formatted files.** Review or back up the target directory first.
The extension list is optional and defaults to `.mout`; it is a comma-separated list with leading dots.
This is a repository script, not an installed package executable.

## Benchmark

Create a payload such as `benchmark-input.json`:

```json
{
    "files": [{ "path": ".\\queries\\example.pq" }],
    "warmupRuns": 1,
    "measuredRuns": 5,
    "phaseTimings": true
}
```

Then run:

```powershell
npm run --silent benchmark -- .\benchmark-input.json
```

Source files are read-only. Paths resolve relative to the payload file; pass `-` for JSON on stdin,
where paths resolve from the working directory. Only `files` is required: defaults are one warmup,
ten measured runs, default formatter settings, and no phase diagnostics.

Measurements **exclude lexing and parsing**. Reports include timing distributions, CPU/memory samples,
and source/output hashes. `phaseTimings` adds a separate diagnostic run, outside the measurements.
JSON is written to stdout and saved with `errors.log` in a unique, gitignored `benchmark-results`
subdirectory. Failures cause a nonzero exit.

See [benchmark configuration and methodology](ARCHITECTURE.md#benchmarking) for all settings, report
semantics, and interpretation. For embedded tracing, see [performance tracing](ARCHITECTURE.md#performance-tracing).

## Related projects

- [powerquery-parser](https://github.com/microsoft/powerquery-parser): Lexer, parser, AST, and shared utilities.
- [powerquery-language-services](https://github.com/microsoft/powerquery-language-services): Language tooling such as IntelliSense.
- [vscode-powerquery](https://github.com/microsoft/vscode-powerquery): Power Query language support for VS Code.
- [vscode-powerquery-sdk](https://github.com/microsoft/vscode-powerquery-sdk): Power Query connector SDK for VS Code.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
