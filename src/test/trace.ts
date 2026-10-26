// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import "mocha";
import * as PQP from "@microsoft/powerquery-parser";
import { expect } from "chai";

import {
    CommentCollectionMap,
    SerializeParameterMap,
    tryPreProcessParameter,
    tryTraverseSerializeParameter,
} from "../powerquery-formatter/passes";
import { DefaultSettings, TriedFormat, TriedSerialize, tryFormat, trySerialize } from "..";
import { FormatTraceConstant } from "../powerquery-formatter/trace";
import { SyncThemeRegistry } from "../powerquery-formatter/themes";

const phaseSet: ReadonlySet<string> = new Set([
    FormatTraceConstant.Format,
    FormatTraceConstant.PostParse,
    FormatTraceConstant.Comment,
    FormatTraceConstant.SerializeParameter,
    FormatTraceConstant.PreProcessParameter,
    FormatTraceConstant.Serialize,
    FormatTraceConstant.LinearLengthCalculation,
]);

interface TraceEvent {
    readonly trace: PQP.Trace.Trace;
    readonly message: string;
    readonly details: object | undefined;
}

class RecordingTraceManager extends PQP.Trace.TraceManager {
    public readonly events: TraceEvent[] = [];
    public onEntry: ((trace: PQP.Trace.Trace) => void) | undefined;

    public override emit(trace: PQP.Trace.Trace, message: string, details?: object): void {
        this.events.push({ trace, message, details });

        if (message === PQP.Trace.TraceConstant.Entry) {
            this.onEntry?.(trace);
        }
    }

    public phaseEvents(): TraceEvent[] {
        return this.events.filter((event: TraceEvent) => phaseSet.has(event.trace.phase));
    }
}

class PhaseTraceManager extends RecordingTraceManager {
    protected override trace(
        phase: string,
        task: string,
        correlationId: number | undefined,
        details?: object,
    ): PQP.Trace.Trace {
        return phaseSet.has(phase) ? super.trace(phase, task, correlationId, details) : PQP.Trace.NoOpTraceInstance;
    }
}

function assertBalanced(manager: RecordingTraceManager): void {
    const stack: PQP.Trace.Trace[] = [];
    const events: TraceEvent[] = manager.phaseEvents();

    expect(events).not.to.be.empty;

    for (const event of events) {
        if (event.message === PQP.Trace.TraceConstant.Entry) {
            if (stack.length) {
                expect(event.trace.correlationId).to.equal(stack[stack.length - 1].id);
            }

            stack.push(event.trace);
        } else if (event.message === PQP.Trace.TraceConstant.Exit) {
            expect(stack.pop()).to.equal(event.trace);
        }
    }

    expect(stack).to.be.empty;
}

async function parse(text: string): Promise<PQP.Task.ParseTaskOk> {
    const parsed: PQP.Task.TriedLexParseTask = await PQP.TaskUtils.tryLexParse(DefaultSettings, text);
    PQP.TaskUtils.assertIsParseStageOk(parsed);

    return parsed;
}

describe("formatter phase tracing", () => {
    it("can collect phase-only traces without per-node events", async () => {
        const manager: PhaseTraceManager = new PhaseTraceManager();
        const text: string = `{${Array.from({ length: 1000 }, (_value: unknown, index: number) => index).join(",")}}`;
        const result: TriedFormat = await tryFormat({ ...DefaultSettings, traceManager: manager }, text);

        expect(PQP.ResultUtils.isError(result)).to.equal(false);
        expect(manager.events).to.have.length(12);
        expect(manager.events).to.deep.equal(manager.phaseEvents());
        assertBalanced(manager);
    });

    for (const maxWidth of [120, 40]) {
        it(`nests post-parse phases without changing output (maxWidth ${maxWidth})`, async () => {
            const text: string = "// leading\nlet x = [a = 1, b = [c = 2]] in x // trailing";
            const expected: TriedFormat = await tryFormat({ ...DefaultSettings, maxWidth }, text);
            const manager: RecordingTraceManager = new RecordingTraceManager();

            const actual: TriedFormat = await tryFormat(
                { ...DefaultSettings, maxWidth, traceManager: manager, initialCorrelationId: 12345 },
                text,
            );

            expect(PQP.ResultUtils.isError(actual)).to.equal(false);
            expect(actual).to.deep.equal(expected);
            assertBalanced(manager);

            const entries: TraceEvent[] = manager
                .phaseEvents()
                .filter((event: TraceEvent) => event.message === PQP.Trace.TraceConstant.Entry);

            expect(entries.map((event: TraceEvent) => event.trace.phase)).to.deep.equal([...phaseSet]);
            expect(entries[0].trace.correlationId).to.equal(12345);
            expect(entries[0].details).to.deep.equal({ inputLength: text.length, maxWidth });

            const parsed: PQP.Task.ParseTaskOk = await parse(text);

            expect(entries[1].details).to.deep.equal({
                astNodeCount: parsed.nodeIdMapCollection.astNodeById.size,
                commentCount: parsed.lexerSnapshot.comments.length,
            });
        });
    }

    for (const phase of [FormatTraceConstant.SerializeParameter, FormatTraceConstant.PreProcessParameter]) {
        for (const cancelled of [false, true]) {
            it(`${phase} exits after asynchronous work settles (cancelled ${cancelled})`, async () => {
                const parsed: PQP.Task.ParseTaskOk = await parse("let x = [a = 1] in x");
                const manager: RecordingTraceManager = new RecordingTraceManager();
                const comments: CommentCollectionMap = new Map();
                const token: PQP.ICancellationToken | undefined = cancelled ? PQP.ExpiredCancellationToken : undefined;

                const pending: Promise<PQP.Traverse.TriedTraverse<SerializeParameterMap>> =
                    phase === FormatTraceConstant.SerializeParameter
                        ? tryTraverseSerializeParameter(
                              parsed.ast,
                              parsed.nodeIdMapCollection,
                              comments,
                              SyncThemeRegistry.defaultInstance.scopeMetaProvider,
                              DefaultSettings.locale,
                              manager,
                              undefined,
                              token,
                          )
                        : tryPreProcessParameter(
                              parsed.ast,
                              parsed.nodeIdMapCollection,
                              comments,
                              manager,
                              DefaultSettings.locale,
                              undefined,
                              token,
                              { parametersMap: new Map() },
                          );

                expect(manager.phaseEvents().map((event: TraceEvent) => event.message)).to.deep.equal([
                    PQP.Trace.TraceConstant.Entry,
                ]);

                const result: PQP.Traverse.TriedTraverse<SerializeParameterMap> = await pending;
                expect(PQP.ResultUtils.isError(result)).to.equal(cancelled);
                assertBalanced(manager);
            });
        }
    }

    for (const text of ['"unterminated', "let x ="]) {
        it(`closes the format span on lex/parse errors: ${text}`, async () => {
            const manager: RecordingTraceManager = new RecordingTraceManager();
            const result: TriedFormat = await tryFormat({ ...DefaultSettings, traceManager: manager }, text);

            expect(PQP.ResultUtils.isError(result)).to.equal(true);
            assertBalanced(manager);

            expect(manager.phaseEvents().map((event: TraceEvent) => event.trace.phase)).to.deep.equal([
                FormatTraceConstant.Format,
                FormatTraceConstant.Format,
            ]);
        });
    }

    it("closes enclosing spans when cancellation happens after parsing", async () => {
        const manager: RecordingTraceManager = new RecordingTraceManager();
        const token: PQP.CounterCancellationToken = new PQP.CounterCancellationToken(Number.MAX_SAFE_INTEGER);

        manager.onEntry = (trace: PQP.Trace.Trace): void => {
            if (trace.phase === FormatTraceConstant.PostParse) {
                token.cancel("cancel formatting after parsing");
            }
        };

        const result: TriedFormat = await tryFormat(
            { ...DefaultSettings, traceManager: manager, cancellationToken: token },
            "// comment\n1",
        );

        expect(PQP.ResultUtils.isError(result)).to.equal(true);
        assertBalanced(manager);

        expect(manager.phaseEvents().map((event: TraceEvent) => event.trace.phase)).to.include(
            FormatTraceConstant.Comment,
        );
    });

    it("closes serialization and length-calculation spans on cancellation", async () => {
        const parsed: PQP.Task.ParseTaskOk = await parse("{1, 2, 3}");
        const manager: RecordingTraceManager = new RecordingTraceManager();

        const result: TriedSerialize = await trySerialize({
            ...DefaultSettings,
            ast: parsed.ast,
            nodeIdMapCollection: parsed.nodeIdMapCollection,
            text: "{1, 2, 3}",
            traceManager: manager,
            cancellationToken: PQP.ExpiredCancellationToken,
            passthroughMaps: {
                commentCollectionMap: new Map(),
                eofCommentCollection: { prefixedComments: [], prefixedCommentsContainsNewline: false },
                containerIdHavingComments: new Set(),
                serializeParameterMap: { parametersMap: new Map() },
            },
        });

        expect(PQP.ResultUtils.isError(result)).to.equal(true);
        assertBalanced(manager);

        expect(manager.phaseEvents().map((event: TraceEvent) => event.trace.phase)).to.deep.equal([
            FormatTraceConstant.Serialize,
            FormatTraceConstant.LinearLengthCalculation,
            FormatTraceConstant.LinearLengthCalculation,
            FormatTraceConstant.Serialize,
        ]);
    });

    it("does not emit a comment phase for comment-free input", async () => {
        const manager: RecordingTraceManager = new RecordingTraceManager();
        const result: TriedFormat = await tryFormat({ ...DefaultSettings, traceManager: manager }, "1");

        expect(PQP.ResultUtils.isError(result)).to.equal(false);
        assertBalanced(manager);

        expect(
            manager.phaseEvents().some((event: TraceEvent) => event.trace.phase === FormatTraceConstant.Comment),
        ).to.equal(false);
    });
});
