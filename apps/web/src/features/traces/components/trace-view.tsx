"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import { tracesApi } from "@/features/traces/traces-api";
import type { RunTrace, TraceQuery, TraceStep } from "@/types/trace";
import "@/features/progress/progress.css";
import "@/features/workspace/run-detail.css";
import "../trace-view.css";

type TraceViewProps = {
  runId: string;
};

export function TraceView({ runId }: TraceViewProps) {
  const [trace, setTrace] = useState<RunTrace | null>(null);
  const [error, setError] = useState<"auth" | "missing" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    tracesApi
      .getByRunId(runId)
      .then((result) => {
        if (!cancelled) {
          setTrace(result);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        if (caught instanceof ApiError && caught.status === 401) {
          setError("auth");
          return;
        }
        if (caught instanceof ApiError && caught.status === 404) {
          setError("missing");
          return;
        }
        setError("load");
      });
    return () => {
      cancelled = true;
    };
  }, [runId]);

  if (error === "auth") {
    return (
      <div className="lp-page lp-page-progress">
        <TraceHeader runId={runId} />
        <p className="lp-pg-note">
          Sign in to view this trace.{" "}
          <Link
            href={`${routes.login}?next=${encodeURIComponent(routes.trace(runId))}`}
            className="lp-link"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  if (error === "missing") {
    return (
      <div className="lp-page lp-page-progress">
        <TraceHeader runId={runId} />
        <section className="lp-panel lp-pg-panel">
          <p className="lp-panel-eyebrow">Retrieval</p>
          <h2 className="lp-panel-title">Trace is not ready</h2>
          <p className="lp-pg-note lp-run-extra">
            This run has no trace yet. Open the run page and wait until it
            finishes, then check again.
          </p>
        </section>
      </div>
    );
  }

  if (error === "load") {
    return (
      <div className="lp-page lp-page-progress">
        <TraceHeader runId={runId} />
        <p className="lp-pg-note">Could not load this trace.</p>
      </div>
    );
  }

  if (!trace) {
    return (
      <div className="lp-page lp-page-progress">
        <TraceHeader runId={runId} />
        <p className="lp-pg-note">Loading…</p>
      </div>
    );
  }

  const queries = trace.queries ?? [];
  const steps = trace.steps ?? [];
  const gated = Boolean(trace.gated);
  const isAgent = trace.simulator === "agent" || steps.length > 0;

  return (
    <div className="lp-page lp-page-progress">
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

      <div className="lp-pg">
        <section className="lp-panel lp-pg-panel">
          <div className="lp-pg-panel-top">
            <p className="lp-panel-eyebrow">Overview</p>
            <h2 className="lp-panel-title">Trace details</h2>
          </div>
          <div className="lp-pg-table-wrap">
            <table className="lp-pg-table">
              <tbody>
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
                    <DetailRow
                      label="Tokens in"
                      value={formatCount(trace.tokensIn)}
                    />
                    <DetailRow
                      label="Tokens out"
                      value={formatCount(trace.tokensOut)}
                    />
                  </>
                )}
                <DetailRow label="Cost" value={formatCost(trace.costEurMicros)} />
              </tbody>
            </table>
          </div>
        </section>

        {isAgent ? (
          <section className="lp-panel lp-pg-panel">
            <div className="lp-pg-panel-top">
              <p className="lp-panel-eyebrow">Agent</p>
              <h2 className="lp-panel-title">Steps</h2>
            </div>
            {gated ? (
              <p className="lp-pg-note">
                {trace.message ??
                  "Full traces are included with Pro. Your scorecard still shows the verdict."}{" "}
                <Link href={routes.billing} className="lp-link">
                  Upgrade
                </Link>
              </p>
            ) : steps.length === 0 ? (
              <p className="lp-pg-empty">No tool steps recorded.</p>
            ) : (
              <StepsTable steps={steps} />
            )}
          </section>
        ) : (
          <section className="lp-panel lp-pg-panel">
            <div className="lp-pg-panel-top">
              <p className="lp-panel-eyebrow">Retrieval</p>
              <h2 className="lp-panel-title">Queries</h2>
            </div>
            {gated ? (
              <p className="lp-pg-note">
                {trace.message ??
                  "Full traces are included with Pro. Your scorecard still shows the verdict."}{" "}
                <Link href={routes.billing} className="lp-link">
                  Upgrade
                </Link>
              </p>
            ) : queries.length === 0 ? (
              <p className="lp-pg-empty">No retrieval steps recorded.</p>
            ) : (
              <div className="lp-pg">
                {queries.map((query) => (
                  <QueryBlock
                    key={`${query.source}-${query.question}`}
                    query={query}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {trace.payload ? (
          <section className="lp-panel lp-pg-panel">
            <div className="lp-pg-panel-top">
              <p className="lp-panel-eyebrow">Raw</p>
              <h2 className="lp-panel-title">Payload</h2>
            </div>
            <pre className="lp-trace-payload">
              {JSON.stringify(trace.payload, null, 2)}
            </pre>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function TraceHeader({
  runId,
  simulator,
}: {
  runId: string;
  simulator?: string;
}) {
  return (
    <header className="lp-run-head">
      <div>
        <h1 className="lp-cat-title">Trace</h1>
        <p className="lp-cat-lead">
          {simulator === "agent"
            ? "Tool steps for this run. Duration is information, not a pass gate."
            : simulator === "benchmark"
              ? "Harness comparison for this run. Wall-clock is information, not a pass gate."
              : simulator
                ? `${simulator} retrieval steps`
                : "Retrieval steps for this run."}
        </p>
      </div>
      <div className="lp-run-links">
        <Link href={routes.run(runId)} className="lp-link">
          Run
        </Link>
        <Link href={routes.progress} className="lp-link">
          Progress
        </Link>
      </div>
    </header>
  );
}

function StepsTable({ steps }: { steps: TraceStep[] }) {
  return (
    <div className="lp-pg-table-wrap">
      <table className="lp-pg-table" data-testid="trace-steps">
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
              <td className="lp-pg-table-skill">{step.name}</td>
              <td className="lp-trace-text">{step.argsSummary || "—"}</td>
              <td className="lp-run-mono">{step.resultBytes} B</td>
              <td>{step.durationMs} ms</td>
              <td>{step.ok ? "yes" : step.error || "no"}</td>
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
      <div>
        <p className="lp-panel-eyebrow">{query.source}</p>
        <p className="lp-trace-q">{query.question}</p>
      </div>
      {query.retrieved.length === 0 ? (
        <p className="lp-pg-empty">No chunks retrieved.</p>
      ) : (
        <div className="lp-pg-table-wrap">
          <table className="lp-pg-table">
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
                  <td className="lp-pg-table-skill">{hit.docId}</td>
                  <td className="lp-run-mono">{hit.chunkId}</td>
                  <td className="lp-pg-table-score">{hit.score}</td>
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
    <div className="lp-pg-stat">
      <span className="lp-pg-stat-value">{value}</span>
      <span className="lp-pg-stat-label">{label}</span>
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
    <tr>
      <th>{label}</th>
      <td className={mono ? "lp-run-mono" : undefined}>{value}</td>
    </tr>
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
