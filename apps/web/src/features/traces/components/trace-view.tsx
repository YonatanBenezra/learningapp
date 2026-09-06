"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { tracesApi } from "@/features/traces/traces-api";
import { workspaceApi } from "@/features/workspace/workspace-api";
import { ApiError } from "@/lib/api-client";
import type { Run } from "@/types/run";
import type { RunTrace, TraceQuery, TraceStep } from "@/types/trace";
import "@/features/workspace/run-detail.css";
import "../trace-view.css";

type TraceViewProps = {
  runId: string;
};

export function TraceView({ runId }: TraceViewProps) {
  const [trace, setTrace] = useState<RunTrace | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<"auth" | "missing" | "load" | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      try {
        const result = await tracesApi.getByRunId(runId);
        if (cancelled) {
          return;
        }
        setTrace(result);
        setRun(null);
        setError(null);
        setBooting(false);
      } catch (caught: unknown) {
        if (cancelled) {
          return;
        }
        if (caught instanceof ApiError && caught.status === 401) {
          setError("auth");
          setBooting(false);
          return;
        }
        if (caught instanceof ApiError && caught.status === 404) {
          let current: Run | null = null;
          try {
            current = await workspaceApi.getRun(runId);
          } catch {
            current = null;
          }
          if (cancelled) {
            return;
          }
          setTrace(null);
          setRun(current);
          setBooting(false);

          const waiting =
            current?.status === "queued" || current?.status === "running";
          if (waiting) {
            setError(null);
            timer = setTimeout(() => {
              void load();
            }, 800);
            return;
          }

          setError("missing");
          return;
        }
        setError("load");
        setBooting(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [runId]);

  if (error === "auth") {
    return (
      <div className="lp-page lp-page-trace">
        <div className="lp-trace">
          <TraceHeader runId={runId} />
          <p className="lp-run-note">
            Sign in to view this trace.{" "}
            <Link
              href={`${routes.login}?next=${encodeURIComponent(routes.trace(runId))}`}
              className="lp-link"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (error === "load") {
    return (
      <div className="lp-page lp-page-trace">
        <div className="lp-trace">
          <TraceHeader runId={runId} />
          <p className="lp-run-note">Could not load this trace.</p>
        </div>
      </div>
    );
  }

  if (error === "missing") {
    return (
      <div className="lp-page lp-page-trace">
        <div className="lp-trace">
          <TraceHeader runId={runId} />
          <section className="lp-run-panel">
            <div className="lp-run-panel-head">
              <p className="lp-run-panel-kicker">Retrieval</p>
              <h2 className="lp-run-panel-title">Trace is not ready</h2>
            </div>
            <div className="lp-trace-empty">
              <p className="lp-run-note">
                This run has no trace yet. Open the run page and wait until it
                finishes, then check again.
              </p>
              <p className="lp-run-note">
                <Link href={routes.run(runId)} className="lp-link">
                  Back to run
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!trace) {
    const waiting =
      run?.status === "queued" || run?.status === "running";
    return (
      <div className="lp-page lp-page-trace">
        <div className="lp-trace">
          <TraceHeader runId={runId} waiting={waiting || booting} />
          {waiting ? (
            <p
              className="lp-run-banner lp-run-banner--live"
              role="status"
              aria-live="polite"
            >
              <span className="lp-run-banner-dot" aria-hidden="true" />
              {run?.status === "queued"
                ? "Waiting for the grading worker…"
                : "Grading in progress…"}{" "}
              Trace appears when this run finishes.
            </p>
          ) : null}
          <TraceSkeleton />
        </div>
      </div>
    );
  }

  const queries = trace.queries ?? [];
  const steps = trace.steps ?? [];
  const gated = Boolean(trace.gated);
  const isAgent = trace.simulator === "agent" || steps.length > 0;

  return (
    <div className="lp-page lp-page-trace">
      <div className="lp-trace">
        <TraceHeader runId={runId} simulator={trace.simulator} />

        <div className="lp-run-stats">
          {isAgent ? (
            <>
              <Stat
                label="Steps"
                value={
                  trace.ceilings
                    ? `${trace.ceilings.stepsUsed} / ${trace.ceilings.maxSteps}`
                    : formatCount(steps.length)
                }
              />
              <Stat
                label="Tool calls"
                value={formatCount(trace.ceilings?.toolCallsUsed ?? steps.length)}
              />
              <Stat
                label="Duration"
                value={
                  typeof trace.sandbox?.durationMs === "number"
                    ? `${trace.sandbox.durationMs} ms`
                    : "—"
                }
              />
              <Stat label="Cost" value={formatCost(trace.costEurMicros)} />
            </>
          ) : (
            <>
              <Stat label="Chunks" value={formatCount(trace.chunkCount)} />
              <Stat label="Top-k" value={formatCount(trace.k)} />
              <Stat
                label="Tokens"
                value={`${trace.tokensIn ?? 0} / ${trace.tokensOut ?? 0}`}
              />
              <Stat label="Cost" value={formatCost(trace.costEurMicros)} />
            </>
          )}
        </div>

        <div className="lp-run-grid">
          <section className="lp-run-panel lp-run-panel--wide">
            <div className="lp-run-panel-head">
              <p className="lp-run-panel-kicker">Overview</p>
              <h2 className="lp-run-panel-title">Trace details</h2>
            </div>
            <dl className="lp-run-rows">
              <DetailRow label="Run ID" value={trace.runId} mono />
              <DetailRow label="Simulator" value={trace.simulator ?? "—"} />
              <DetailRow
                label="Created"
                value={trace.createdAt ? formatWhen(trace.createdAt) : "—"}
              />
              {isAgent ? (
                <>
                  <DetailRow
                    label="Steps"
                    value={
                      trace.ceilings
                        ? `${trace.ceilings.stepsUsed} / ${trace.ceilings.maxSteps}`
                        : formatCount(steps.length)
                    }
                  />
                  <DetailRow
                    label="Tool calls"
                    value={`${trace.ceilings?.toolCallsUsed ?? steps.length} / ${trace.ceilings?.maxToolCalls ?? "—"}`}
                  />
                  <DetailRow
                    label="Duration"
                    value={
                      typeof trace.sandbox?.durationMs === "number"
                        ? `${trace.sandbox.durationMs} ms (information)`
                        : "—"
                    }
                  />
                </>
              ) : (
                <>
                  <DetailRow label="Chunks" value={formatCount(trace.chunkCount)} />
                  <DetailRow label="Top-k" value={formatCount(trace.k)} />
                  <DetailRow label="Tokens in" value={formatCount(trace.tokensIn)} />
                  <DetailRow
                    label="Tokens out"
                    value={formatCount(trace.tokensOut)}
                  />
                </>
              )}
              <DetailRow label="Cost" value={formatCost(trace.costEurMicros)} />
            </dl>
          </section>

          <section className="lp-run-panel lp-run-panel--wide">
            <div className="lp-run-panel-head">
              <p className="lp-run-panel-kicker">{isAgent ? "Agent" : "Retrieval"}</p>
              <h2 className="lp-run-panel-title">
                {isAgent ? "Steps" : "Queries"}
              </h2>
            </div>
            {gated ? (
              <div className="lp-trace-gated">
                <span>
                  {trace.message ??
                    "Full traces are included with Pro. Your scorecard still shows the verdict."}
                </span>
                <Link href={routes.billing}>Upgrade</Link>
              </div>
            ) : isAgent ? (
              steps.length === 0 ? (
                <p className="lp-run-empty">No tool steps recorded.</p>
              ) : (
                <StepsTable steps={steps} />
              )
            ) : queries.length === 0 ? (
              <p className="lp-run-empty">No retrieval steps recorded.</p>
            ) : (
              <div className="lp-trace-queries">
                {queries.map((query) => (
                  <QueryBlock
                    key={`${query.source}-${query.question}`}
                    query={query}
                  />
                ))}
              </div>
            )}
          </section>

          {trace.payload ? (
            <section className="lp-run-panel lp-run-panel--wide">
              <div className="lp-run-panel-head">
                <p className="lp-run-panel-kicker">Raw</p>
                <h2 className="lp-run-panel-title">Payload</h2>
              </div>
              <pre className="lp-trace-payload">
                {JSON.stringify(trace.payload, null, 2)}
              </pre>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TraceHeader({
  runId,
  simulator,
  waiting,
}: {
  runId: string;
  simulator?: string;
  waiting?: boolean;
}) {
  return (
    <header className="lp-run-hero">
      <div>
        <p className="lp-run-kicker">{waiting ? "Waiting" : "Inspection"}</p>
        <h1 className="lp-run-title">Trace</h1>
        <p className="lp-run-lead">
          {simulator === "agent"
            ? "Tool steps for this run. Duration is information, not a pass gate."
            : simulator === "benchmark"
              ? "Harness comparison for this run. Wall-clock is information, not a pass gate."
              : simulator
                ? `${simulator} retrieval steps for this run.`
                : waiting
                  ? "Trace unlocks when grading finishes."
                  : "Retrieval steps for this run."}
        </p>
      </div>
      <nav className="lp-run-nav" aria-label="Trace links">
        <Link href={routes.run(runId)}>Run</Link>
        <Link href={routes.progress}>Progress</Link>
      </nav>
    </header>
  );
}

function TraceSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading trace">
      <div className="lp-run-stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="lp-run-stat">
            <span
              className="lp-skel-line"
              style={{
                width: "52%",
                height: "1.15rem",
                margin: "0.1rem 0 0.15rem",
                borderRadius: "0.4rem",
              }}
            />
            <span className="lp-run-stat-label">Loading</span>
          </div>
        ))}
      </div>
      <div className="lp-run-grid" style={{ marginTop: "1.25rem" }}>
        <section className="lp-run-panel">
          <span
            className="lp-skel-line"
            style={{ width: "4.5rem", height: "0.55rem", margin: 0 }}
          />
          <span
            className="lp-skel-line lp-skel-line--title"
            style={{ width: "9rem", height: "1rem", margin: "0.35rem 0 0.85rem" }}
          />
          <div className="lp-run-skel-rows">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="lp-run-skel-row">
                <span className="lp-skel-line" />
                <span className="lp-skel-line" />
              </div>
            ))}
          </div>
        </section>
        <section className="lp-run-panel">
          <span
            className="lp-skel-line"
            style={{ width: "5rem", height: "0.55rem", margin: 0 }}
          />
          <span
            className="lp-skel-line lp-skel-line--title"
            style={{ width: "7rem", height: "1rem", margin: "0.35rem 0 0.85rem" }}
          />
          <div className="lp-trace-skel-steps">
            <div className="lp-trace-skel-step" />
            <div className="lp-trace-skel-step" />
            <div className="lp-trace-skel-step" />
          </div>
          <div className="lp-trace-skel-query" style={{ marginTop: "0.35rem" }}>
            <span className="lp-skel-line" style={{ width: "3.5rem" }} />
            <span className="lp-skel-line lp-skel-line--title" />
            <div className="lp-trace-skel-hits">
              <div className="lp-trace-skel-hit" />
              <div className="lp-trace-skel-hit" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StepsTable({ steps }: { steps: TraceStep[] }) {
  return (
    <div className="lp-run-table-wrap">
      <table className="lp-run-table" data-testid="trace-steps">
        <thead>
          <tr>
            <th>#</th>
            <th>Kind</th>
            <th>Name</th>
            <th>Args</th>
            <th>Result</th>
            <th>Duration</th>
            <th>Ok</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => (
            <tr key={step.index} data-testid="trace-step">
              <td className="lp-run-mono">{step.index}</td>
              <td>{step.kind}</td>
              <td className="lp-run-fail-q">{step.name}</td>
              <td className="lp-trace-text">{step.argsSummary || "—"}</td>
              <td className="lp-run-mono">{step.resultBytes} B</td>
              <td>{step.durationMs} ms</td>
              <td className={step.ok ? "lp-trace-ok" : "lp-trace-bad"}>
                {step.ok ? "yes" : step.error || "no"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QueryBlock({ query }: { query: TraceQuery }) {
  return (
    <div className="lp-trace-query" data-testid="trace-query">
      <div className="lp-trace-query-top">
        <p className="lp-trace-source">{query.source}</p>
        <p className="lp-trace-q">{query.question}</p>
      </div>
      {query.retrieved.length === 0 ? (
        <p className="lp-run-empty">No chunks retrieved.</p>
      ) : (
        <div className="lp-run-table-wrap">
          <table className="lp-run-table">
            <thead>
              <tr>
                <th>Doc</th>
                <th>Chunk</th>
                <th>Score</th>
                <th>Text</th>
              </tr>
            </thead>
            <tbody>
              {query.retrieved.map((hit) => (
                <tr key={hit.chunkId}>
                  <td className="lp-run-fail-q">{hit.docId}</td>
                  <td className="lp-run-mono">{hit.chunkId}</td>
                  <td className="lp-run-metric-value">{hit.score}</td>
                  <td className="lp-trace-text">{hit.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="lp-run-stat">
      <p className="lp-run-stat-value">{value}</p>
      <span className="lp-run-stat-label">{label}</span>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="lp-run-row">
      <dt>{label}</dt>
      <dd className={mono ? "lp-run-mono" : undefined}>{value}</dd>
    </div>
  );
}

function formatCount(value?: number) {
  return typeof value === "number" ? String(value) : "—";
}

function formatCost(micros?: number) {
  if (typeof micros !== "number") {
    return "—";
  }
  return `€${(micros / 1_000_000).toFixed(4)}`;
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
