# Architecture

This document describes the implementation in this checkout, including the formatter-only API,
phase tracing, and benchmark CLI. For installation and quick-start usage, see [README.md](README.md).

## Design and boundaries

The formatter is an AST-driven, multi-pass source printer. It does not evaluate Power Query / M,
perform language-service analysis, or construct a separate document-layout intermediate representation.
Formatting policy lives mainly in a theme of scope-based rules; a small preprocessing pass adds
source-sensitive rules, and a stateful serializer makes layout decisions while emitting text.

`@microsoft/powerquery-parser` supplies lexing, parsing, AST types, node-id maps, traversal utilities,
results, errors, tracing, and cancellation types. The formatter owns comment attachment, formatting
parameters, inline-length estimates, and output construction. The library itself does no file I/O.

### Source layout and packaging

| Location | Responsibility |
| --- | --- |
| `src\powerquery-formatter\format.ts` | Public formatting entry points and pass orchestration. |
| `src\powerquery-formatter\serialize.ts` | Layout decisions, whitespace handling, and output state. |
| `src\powerquery-formatter\passes\comment.ts` | Attach lexer comments to AST leaves and containers. |
| `src\powerquery-formatter\passes\serializeParameter.ts` | Resolve a formatting parameter object for each node. |
| `src\powerquery-formatter\passes\preProcessParameter.ts` | Apply source-sensitive record overrides. |
| `src\powerquery-formatter\passes\utils\linearLength.ts` | Active cached inline-length estimator. |
| `src\powerquery-formatter\passes\commonTypes.ts` | Shared pass maps, state types, and parameter vocabulary. |
| `src\powerquery-formatter\themes` | Default rules, scope naming, selector matching, trie, and caches. |
| `src\powerquery-formatter\trace.ts` | Formatter trace phase names. |
| `src\benchmark` | JSON configuration, measurement engine, phase diagnostics, and CLI reports. |
| `src\scripts\recursiveDirectoryFormat.ts` | Recursive, in-place file formatting utility. |
| `src\test` | Formatting examples, tracing regressions, and benchmark tests. |

`src\powerquery-formatter\index.ts` re-exports `format.ts` and `serialize.ts`; `src\index.ts`
re-exports that library barrel for repository consumers. Theme and pass internals are not re-exported
through the main library barrel.

`tsconfig.json` compiles strict TypeScript to CommonJS/ES2022 under `lib`, with declarations, source maps,
and incremental build metadata. `package.json` points consumers at
`lib\powerquery-formatter\index.js` and its declaration file. Its `files` list selects the formatter
subtree, not the compiled tests, benchmark CLI, or scripts. Those tools are run from a checkout.
The dependency manifest requires Node.js 22 or later; current CI jobs run on Windows with Node.js 22.

### API boundaries

| Entry point | Required inputs | Work performed |
| --- | --- | --- |
| `tryFormat` | `FormatSettings`, source text | Lex/parse, then all formatter passes. Returns lex/parse errors before formatting. |
| `tryFormatParsed` | Settings, original text, `PQP.Task.ParseTaskOk` | All formatter passes using the supplied AST, comments, and maps. No lex/parse call. |
| `trySerialize` | `SerializeSettings` with AST, source, node maps, and `SerializePassthroughMaps` | Length estimation and serialization only. Does not derive formatting or comment parameters. |

All three return promises of `Result` values. `TriedFormat` includes lexical, parse, and common errors;
`TriedSerialize` carries common errors.

**Prepared inputs must remain consistent.** `tryFormatParsed` requires the exact text used to produce
the parse result. Node ids must refer to the same AST in every associated map. Token positions and
original source slices still influence formatting, so an AST alone is not sufficient. Each formatting
call creates its own pass maps and serializer state; formatting does not rewrite the supplied AST.

The relevant `NodeIdMap.Collection` indexes are `astNodeById` for node lookup, `childIdsById` for
ordered traversal, and `parentIdById` for ancestor lookup. Comments and AST token ranges carry source
positions; the formatter uses their code-unit offsets and line numbers rather than reconstructing
those relationships from printed text.

`FormatSettings` extends the parser's settings and adds `maxWidth`, `indentationLiteral`, and
`newlineLiteral`. There is no per-request theme option. `trySerialize` accepts an already-effective width;
the two-character adjustment described below belongs to the higher-level formatting path.

## Formatting pipeline

The active call chain in `format.ts` is:

```text
source text + FormatSettings
    |
tryFormat
    +-- PQP.TaskUtils.tryLexParse
    |       -> AST + lexer comments + NodeIdMap.Collection
    |
    +-- tryFormatParsed          <-- callers with a successful parse can enter here
            +-- tryTraverseComment                 (only when comments exist)
            +-- adjust container comment counts
            +-- tryTraverseSerializeParameter
            +-- tryPreProcessParameter
            +-- trySerialize
                    +-- getLinearLength            (cached, computed on demand)
                    +-- serializeNode              (ordered traversal)
                    +-- emit EOF comments and perform final whitespace cleanup
                            -> Result<string, error>
```

Passes execute sequentially. The serializer's mutable output state makes sibling order significant;
parallelizing child serialization would not preserve its current semantics.

### Comment attachment

Source: `passes\comment.ts` and the comment-count adjustment in `format.ts`.

Comments arrive separately from the AST in lexer order. The comment pass walks the AST and attaches
comments preceding a leaf's source position to that leaf's `CommentCollection`. It advances a single
comment cursor, skips subtrees ending before the next comment, and stops visiting once comments are
exhausted. Comments remaining after traversal become the end-of-file collection.

For each leaf receiving comments, the pass walks upward to the nearest ancestor in `ContainerSet`.
It records that relationship and counts comment-bearing leaves per container, rather than counting
every individual comment. The orchestrator then discounts a particular case: when the last prefixed
comment is marked `containsNewline` and the leaf is the container's first immediate child, that
attachment need not force the container out of inline layout. Containers with a remaining positive
count populate `containerIdHavingComments`.

| Data | Used by |
| --- | --- |
| `commentCollectionMap` | Serializer, when visiting leaves. |
| `eofCommentCollection` | Serializer, after the root node. |
| `parentContainerIdOfNodeId`, `containerIdHavingCommentsChildCount` | Orchestrator's comment-layout adjustment. |
| `containerIdHavingComments` | Serializer's inline/block decision. |

`ContainerSet` is the static node-kind classification in `themes\constants.ts`. It is related to, but
not dynamically rebuilt from, a replacement theme.

### Formatting parameters

Source: `passes\serializeParameter.ts`, `themes\scopeNameHelpers.ts`, and `themes\scopes.ts`.

A depth-first walk maintains a `StackElement` and linked `ScopeListElement` chain. Each AST node gets
a scope name: normally its `NodeKind`, or a dotted scope such as `constant.keyword.let` for a constant.
The pass resolves the node's scope against the current ancestry and stores the resulting
`SerializeParameter` under its node id in `parametersMap`.

Parameter objects can be shared with theme rules and other nodes. They must not be mutated as if they
were private node state. The record preprocessor copies an object before adding its override; the
serializer also copies parameters when it needs a local inline-padding adjustment.

### Record preprocessing

Source: `passes\preProcessParameter.ts`.

The current preprocessor dictionary contains only `RecordExpression` and `RecordLiteral`. A record
is forced into block mode when its opening and closing brackets were on different source lines, or
when a field directly contains a `RecordExpression`. The override is applied both to the record and
to its content wrapper through the existing parameter map.

This remains a separate full-tree walk even when there are no records. The implementation invokes
processors on children before descending into them; it does **not** invoke the processor on the
initial root node itself. That is a current behavioral limitation, not a general record-layout guarantee.
There is no public preprocessor-registration API.

## Theme-based policy

Sources: `themes\types.ts`, `themes\themes.ts`, `themes\scopes.ts`, `themes\register.ts`,
and `themes\constants.ts`.

Here, a "theme" is a collection of layout rules, not colors or editor styling. Each raw rule combines
one or more scope selectors with a parameter object. The default theme covers containers, punctuation,
operators, `let`/`in`, conditionals, functions, field access, and sections.

Rule resolution has two stages:

1. `parseTheme` separates comma-separated or array-valued selectors and reverses ancestor selectors
   for matching from the immediate parent outward. `Theme` builds a trie on dotted scope segments,
   merging repeated rules with the same selector and sorting candidates by specificity.
2. `ScopeListElement.mergeParameters` walks those candidates and takes the first rule whose ancestor
   constraints match. An ancestor selector ending in `>` requires an immediate match at that step;
   otherwise matching can search upward. Dotted scopes support prefix matching.

More-specific scope depth takes precedence; ancestor selector count and lengths break further ties.
Do not assume CSS-style cascading or automatic inheritance of all parent-node parameters: the
runtime scope matcher selects a resolved rule, or an empty parameter object when none supplies one.

Important parameter groups in `passes\commonTypes.ts` are:

| Parameters | Purpose |
| --- | --- |
| `container`, `indentContainerOnEnter`, `skipPostContainerNewLine` | Scope indentation and end-of-container behavior. |
| `forceBlockMode`, `inheritParentMode`, `ignoreInline` | Influence layout mode and whether a block can become inline. |
| `blockOpener`, `blockCloser`, `contentDivider` | Perform layout actions to the left (`"L"`) or right (`"R"`) of a token. |
| `leftPadding`, `rightPadding`, `lineBreak`, `doubleLineBreak` | Token spacing and generated breaks. |
| Whitespace-clearing and `noWhitespaceAppended` flags | Join punctuation and suppress unwanted spaces. |
| `blockOpenerActivatedMatcher`, `dedentContainerConditionReg` | Source/output-sensitive regular-expression conditions. |

`SyncThemeRegistry.defaultInstance` is shared across calls. Its `Theme` caches candidate rules by
scope name; `ScopeMetadataProvider` separately caches scope metadata. `setTheme` replaces the theme
and clears the metadata cache. This is internal, shared configuration, not request-local
customization. Changing it affects subsequent formatting and should not be done during active calls.

## Length estimation and serialization

### Inline-length estimation

Source: `passes\utils\linearLength.ts`.

`getLinearLength` memoizes estimates by node id in a serializer-local `LinearLengthMap`. A cache miss
runs a post-order AST traversal. Leaves contribute their literal/constant lengths; parent rules sum
child estimates and syntax-specific spacing. The cache is populated for visited descendants as well
as the requested node. Subsequent node visits reuse those values, although the helper still has an
async interface.

The estimator is not a dry run of the complete serializer: it does not consume the comment map or
all formatting parameters. Its numbers are layout heuristics, not exact output lengths. In particular,
the active implementation computes estimates for `IfExpression` and `LetExpression`; older comments
describing them as always multiline are not the current behavior.

### Layout decisions

Sources: `format.ts` and `serialize.ts` (`stateFromSettings`, `serializeNode`, `serializeLiteral`).

The high-level formatter passes `maxWidth - 2` to serialization to reserve padding space. The serializer
enables inline-block support only when its effective width is greater than 40; through `tryFormat`,
that means the requested width must exceed 42.

When inline support is enabled, the root estimate is computed before output traversal. Otherwise the
first `serializeNode` call triggers the estimate. Per-node decisions account for the estimate plus
current line or indentation length, inherited layout, directly attached comments, and parameter
overrides. `forceBlockMode` prevents inline layout; `inheritParentMode` has its own precedence;
`ignoreInline` prevents promoting a block to inline but does not categorically prohibit inheriting
an inline parent.

Width comparisons use JavaScript string lengths, not rendered display columns. Tabs count as one
code unit, literals are not arbitrarily split, and comments or long tokens can exceed the requested
width. Newline settings govern generated breaks, not a rewrite of newline characters embedded in
literal or comment data.

### Output state

Source: `serialize.ts`.

The serializer emits directly into mutable state rather than a token-edit list or document tree:

| State | Role |
| --- | --- |
| `formatted` | Entire output accumulated so far. |
| `currentLine` | Overlapping accumulator since the last explicitly appended newline; used for layout and padding. It is not a separate buffer awaiting a flush. |
| `indentationLevel`, `indentationCache` | Current depth and lazily extended indentation strings. |
| `blockStatusArray` | Nested `Block`/`InlineBlock` modes. |
| `lastTokenType` | Opener/closer/divider/content/comment context for spacing decisions. |
| Pseudo-line and pseudo-padding flags | Allow removal of a generated break or suppression of padding without re-indenting the joined text. |
| `currentSectionMember` | Previous section member, used for blank-line grouping. |

For each node, serialization evaluates container dedentation and mode, emits prefixed comments at
leaves, applies left-side layout actions, emits the literal or visits children in order, and applies
right-side actions. Leaving a container restores its saved indentation and truncates the block-status
stack to its saved boundary.

Whitespace helpers must keep the overlapping output/line state consistent. Pseudo-lines let punctuation
and empty wrappers join text after a generated newline has been removed. They also participate in
`else if` layout. `dedentContainer` tests its regex only when `currentLine` is empty.

Section formatting additionally inspects original text between members and groups member names by
the prefix before their first dot. It preserves some intentional blank-line separation, not all
source whitespace verbatim.

After the root, the serializer emits end-of-file comments, trims trailing CR/LF characters and then
spaces/tabs, and appends the configured newline.

### State ownership and performance

ASTs and node-id collections come from the parser and are treated as read-only inputs. Comment maps,
parameter maps, length caches, and output state are created per formatting call. Theme rules and their
scope caches are shared. No document-level incremental formatting cache is maintained across calls.

Performance-sensitive mechanisms include repeated access to the growing output string during
cleanup, regex matching against output/source slices, async boundaries around CPU-only tree walks,
temporary arrays in length aggregation, and repeated traversals. These are investigation targets,
not a universal complexity or speedup guarantee. Workload shape, output size, nesting, and runtime
string/GC behavior matter; use the benchmark and CPU profiles on representative connectors.

### Inactive multiline passes

`passes\isMultiline` contains an alternative two-pass multiline classifier and a separate length
implementation. It is not called by the current `tryFormat`/`tryFormatParsed` pipeline, and the active
passes barrel does not export it. Do not mistake those files or their `Format.IsMultiline*` trace
constants for the active layout algorithm. Active width behavior belongs to `serialize.ts` and
`passes\utils\linearLength.ts`.

## Errors and cancellation

The orchestrator returns early on error results from parsing and each formatting pass. Pass traversal
and serialization use the parser's `ResultUtils.ensureResultAsync` or traversal wrappers to normalize
errors. This does not promise that arbitrary failures in caller-provided tracing or setup code cannot
reject the returned promise.

Cancellation is cooperative. Parameter generation and preprocessing explicitly check tokens; parser
traversal utilities used by comments and length calculation also check them. **The current high-level
formatter sets `cancellationToken: undefined` when constructing its serialization request.** Therefore
`tryFormat` and `tryFormatParsed` do not provide end-to-end cancellation of serialization. A direct
`trySerialize` call can pass a token to length traversal, but the serializer is not a preemptible worker
and does not check cancellation at every output operation.

Coarse trace spans use `try/finally` and await the operation before exiting, including error and
cancellation paths. In particular, parameter-generation and preprocessing durations cover the actual
asynchronous traversal rather than just creation of its promise.

## Performance tracing

Sources: `trace.ts`, phase entry points, and the benchmark's `PhaseTraceManager`.

The default trace manager is a no-op. The active coarse spans are:

| Phase | Scope |
| --- | --- |
| `Format` | Complete request, including lex/parse; input length and requested width are entry details. |
| `Format.PostParse` | Formatter work only; entry details include AST node and comment counts. |
| `Format.Comment` | Comment attachment and EOF collection; skipped by the high-level pipeline when no comments exist. |
| `Format.SerializeParameter` | Theme/scope parameter generation. |
| `Format.PreProcessParameter` | Record preprocessing. |
| `Format.Serialize` | Length estimation and output construction; reports effective width. |
| `Format.LinearLengthCalculation` | An uncached subtree estimate; reports its root node id. Cache hits add no span. |

Correlation ids connect the format request to post-parse work, its passes, and nested length
calculations. Durations are inclusive: do not sum parent and child spans. Subtract length-calculation
time from serialization time to estimate remaining output work. Neither number is a GC-free CPU metric.

Existing per-node `Format.LinearLength` and parser traversal traces are too detailed for low-overhead
timing. Filter before trace allocation, not only before writing logs. For example:

```ts
import * as PQP from "@microsoft/powerquery-parser";

const phases = new Set([
    "Format",
    "Format.PostParse",
    "Format.Comment",
    "Format.SerializeParameter",
    "Format.PreProcessParameter",
    "Format.Serialize",
    "Format.LinearLengthCalculation",
]);

class PhaseTraceManager extends PQP.Trace.BenchmarkTraceManager {
    protected override trace(
        phase: string,
        task: string,
        correlationId: number | undefined,
        details?: object,
    ): PQP.Trace.Trace {
        return phases.has(phase)
            ? super.trace(phase, task, correlationId, details)
            : PQP.Trace.NoOpTraceInstance;
    }
}

const entries: string[] = [];
const traceManager = new PhaseTraceManager((entry: string) => entries.push(entry));
```

Pass `traceManager` in formatter settings, then read `entries` after the call settles. Buffering avoids
synchronous log I/O during the measured work. Filtering still has some overhead; use a no-op manager
for CPU profiling and uninstrumented timing comparisons.

## Benchmarking

Sources: `src\benchmark\config.ts`, `benchmark.ts`, and `cli.ts`.

The benchmark CLI follows the PQLS JSON-payload/report approach. It is a developer tool, not part of
the main library exports. [README.md](README.md#benchmark) shows a minimal invocation.

### Configuration

| Field | Default | Accepted values |
| --- | --- | --- |
| `files` | Required | Nonempty array of `{ "path": "..." }` objects with nonblank paths. |
| `warmupRuns` | `1` | Nonnegative safe integer. |
| `measuredRuns` | `10` | Positive safe integer; total warmup plus measured runs must also be safe. |
| `phaseTimings` | `false` | Boolean; adds one separate diagnostic run per file. |
| `settings.maxWidth` | `120` | Positive safe integer. |
| `settings.indentationLiteral` | `"    "` | Four spaces or `"\t"`. |
| `settings.newlineLiteral` | `"\r\n"` | CRLF or LF (`"\n"`). |

The `settings` object is optional. Unknown properties are rejected at each configuration level.
This validation belongs to the benchmark CLI; it is not a runtime validation layer for arbitrary
`FormatSettings` supplied directly to the library.

Paths are absolute or relative to the payload file; with stdin (`-`) they are relative to the working
directory. Payloads and sources are UTF-8, with leading BOMs removed before parsing. The runner reads
all source files before measured work and keeps them in memory. File sizes and source SHA-256 hashes
describe the original bytes, including any BOM.

### Measurement lifecycle

Each file runs sequentially through:

```text
for every warmup/sample:
    parse original source into fresh AST/maps     [not timed; tracing off]
    request GC if exposed by Node                [not timed]
    capture memory/CPU baselines; start clock     [measured samples only]
    tryFormatParsed                              [timed only for measured samples; tracing off]
    stop clocks and capture memory               [measured samples only]
    check Result and compare output hash         [not timed]

if phaseTimings:
    fresh parse                                  [not timed; tracing off]
    request GC if available
    one format with coarse phase tracing         [diagnostic only, not a measurement sample]
    compare output hash
```

Every run gets fresh formatter state as well as fresh parse state; default theme caches remain shared
and are warmed rather than rebuilt. The tool uses the real formatter-only API, not a monkey-patched
parser or a duplicated formatting pipeline. `npm run benchmark` enables `--expose-gc`; the report
records whether GC was available.

Measurements include average, median, minimum, maximum, and raw wall-clock/CPU samples, plus process
memory before/after snapshots and byte deltas for RSS, heap used/total, external memory, and array
buffers. They exclude file I/O, preparation, explicit pre-run GC, hashing, diagnostics, and report I/O.
GC occurring during formatting is still part of that sample.

Output summaries contain code-unit length and a SHA-256 hash. Warmups, measurements, and optional
diagnostics must agree; changed output fails the file rather than becoming a valid timing sample.
Reports include a schema version, environment, normalized configuration, timing-mode labels, and
per-file identities and results. They do not automatically record the Git revision: retain the
revision/worktree context when comparing saved reports.

Memory deltas are process-wide snapshots, not allocations or peak usage, and can be negative. CPU
statistics are process-wide too. Match inputs, settings, Node/runtime environment, and output hashes
across comparisons; inspect sample spread rather than treating a small median difference as proof
of improvement. Phase diagnostics are a separate, instrumented observation and must not be compared
as if they were the uninstrumented samples.

### CLI output and failures

Each invocation creates a unique `benchmark-results\<UTC-timestamp>-<suffix>` directory under the
working directory. The directory path goes to stderr; the report goes to stdout and `report.json`.
Use `npm run --silent benchmark` to suppress npm's own stdout banner. `errors.log` is empty on success.
The results directory is gitignored; neither payloads nor query files are overwritten.

Invalid payloads and source-file loading failures abort before measurements and leave no benchmark
report. Per-file preparation, formatting, output-consistency, or diagnostic failures produce an error
result without a successful measurement summary, and remaining files continue. Such failures cause
a nonzero CLI exit. Log-creation/persistence errors also cause a nonzero exit; completed report JSON
is emitted to stdout before attempting to persist it.

## Tests and extension guidance

Source: `src\test` and the build/test configuration.

`simple.ts`, `comments.ts`, `section.ts`, and `smallPrograms.ts` cover syntax and formatting examples.
`common.ts`'s `expectFormat` formats twice and compares the results for stability. Its comparison trims
outer whitespace and compares lines; it is not an AST/token-equivalence proof or a byte-exact EOF
assertion. Use explicit assertions when a change depends on exact trailing whitespace or newlines.

`serialize.ts` tests inline/block dedent matching. `trace.ts` covers asynchronous span lifetimes,
correlations, error/cancellation closure, and coarse filtering. `benchmark.ts` tests configuration,
timing boundaries with a controlled clock, fresh preparation, output consistency, read-only inputs,
report persistence, and CLI failures. These tests do not impose noisy wall-clock performance thresholds.

When changing behavior:

1. Start with `themes\constants.ts` for scope-driven spacing or container policy; use preprocessing
   only for decisions that need AST/source context beyond selectors.
2. For new syntax, inspect scope-name mapping, container classification, active length estimation,
   and serializer dispatch together. A theme rule alone may not cover every surface.
3. Preserve shared-parameter immutability and source/AST/map consistency. Keep stateful serialization
   ordered, and treat output/line/pseudo-line bookkeeping as a coupled mechanism.
4. Add focused examples, repeated-format checks, and exact-output assertions where needed. Compare
   representative benchmark distributions and output hashes for performance changes.

Normal development uses `npm run build`, `npm run lint`, and `npm test`. The GitHub pull-request
workflow builds and tests on Windows/Node 22; the Azure pipeline also packages and publishes build
artifacts. Some linking and prepublish scripts contain `git clean -xdf`: they are destructive to
untracked files and are not substitutes for ordinary local validation.
