"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { workspaceApi } from "@/features/workspace/workspace-api";
import { ApiError } from "@/lib/api-client";
import type { FailingCase, Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import { ScorecardIntervals } from "./scorecard-intervals";
import "../run-detail.css";

type RunDetailProps = {
  runId: string;
};

export function RunDetail({ runId }: RunDetailProps) {
  const [run, setRun] = useState<Run | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [error, setError] = useState<"auth" | "missing" | "load" | null>(null);
  const [queuedSince, setQueuedSince] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const loadGrade = async (id: string) => {
      try {
        return await workspaceApi.getGrade(id);
      } catch {
        return null;
      }
    };

    const poll = async () => {
      try {
        const result = await workspaceApi.getRun(runId);
        if (cancelled) {
          return;
        }
        setRun(result);
        setError(null);

        if (result.status === "queued") {
          setQueuedSince((prev) => prev ?? Date.now());
        } else {
          setQueuedSince(null);
        }

        if (result.status === "succeeded") {
          setGrade(await loadGrade(runId));
          return;
        }

        if (result.status === "running" || result.status === "queued") {
          timer = setTimeout(() => {
            void poll();
          }, 400);
          return;
        }

        setGrade(null);
      } catch (caught: unknown) {
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
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [runId]);

  useEffect(() => {
    if (!run || (run.status !== "queued" && run.status !== "running")) {
      return;
    }
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [run]);

  const workerMaybeOffline =
    run?.status === "queued" &&
    queuedSince !== null &&
    now - queuedSince > 30_000;

  if (error === "auth") {
    return (
      <div className="lp-page lp-page-run">
        <p className="lp-run-note">
          Sign in to view this run.{" "}
          <Link
            href={`${routes.login}?next=${encodeURIComponent(routes.run(runId))}`}
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
      <div className="lp-page lp-page-run">
        <p className="lp-run-note">Run not found.</p>
      </div>
    );
  }

  if (error === "load") {
    return (
      <div className="lp-page lp-page-run">
        <p className="lp-run-note">Could not load this run.</p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="lp-page lp-page-run">
        <RunDetailSkeleton />
      </div>
    );
  }

  const metrics = Object.entries(grade?.metrics ?? {});
  const cases = Array.isArray(grade?.failingCases) ? grade.failingCases : [];
  const inFlight = run.status === "queued" || run.status === "running";

  return (
    <div className="lp-page lp-page-run">
      <div className="lp-run">
        <header className="lp-run-hero">
          <div>
            <p className="lp-run-kicker">Grading</p>
            <h1 className="lp-run-title">Run</h1>
            <p className="lp-run-lead">
              {run.title && run.exerciseSlug ? (
                <Link href={routes.exercise(run.exerciseSlug)}>{run.title}</Link>
              ) : (
                "Scorecard and run details."
              )}
            </p>
          </div>
          <nav className="lp-run-nav" aria-label="Run links">
            {run.exerciseSlug ? (
              <Link href={routes.exercise(run.exerciseSlug)}>Exercise</Link>
            ) : null}
            <Link href={routes.trace(run.id)}>Trace</Link>
            <Link href={routes.progress}>Progress</Link>
          </nav>
        </header>

        {inFlight ? (
          <p className="lp-run-banner lp-run-banner--live" role="status" aria-live="polite">
            <span className="lp-run-banner-dot" aria-hidden="true" />
            {run.status === "queued"
              ? "Waiting for the grading worker…"
              : "Grading in progress…"}{" "}
            This page updates automatically.
          </p>
        ) : null}
        {workerMaybeOffline ? (
          <p className="lp-run-banner lp-run-banner--warn" role="status">
            Still queued after 30s. The grading worker may be offline — start it
            with <code>npm run dev:worker</code> or <code>npm run dev</code> from
            the repo root.
          </p>
        ) : null}

        <div className="lp-run-stats">
          <Stat label="Status" value={run.status} />
          <Stat
            label="Verdict"
            value={grade?.verdict ?? (inFlight ? null : "—")}
            testId="verdict"
            loading={inFlight && !grade}
            tone={verdictTone(grade?.verdict)}
          />
          <Stat
            label="Metrics"
            value={
              metrics.length
                ? String(metrics.length)
                : inFlight
                  ? null
                  : "—"
            }
            loading={inFlight && !grade}
          />
          <Stat label="Cost" value={formatCost(run.costEurMicros)} />
        </div>

        <div className="lp-run-grid">
          <section className="lp-run-panel">
            <div className="lp-run-panel-head">
              <p className="lp-run-panel-kicker">Overview</p>
              <h2 className="lp-run-panel-title">Run details</h2>
            </div>
            <dl className="lp-run-rows">
              <DetailRow label="Run ID" value={run.id} mono />
              <DetailRow label="Status" value={run.status} />
              {run.errorCode ? (
                <DetailRow label="Error code" value={run.errorCode} />
              ) : null}
              {run.errorMessage ? (
                <DetailRow label="Error" value={run.errorMessage} />
              ) : null}
              <DetailRow label="Tokens in" value={formatCount(run.tokensIn)} />
              <DetailRow label="Tokens out" value={formatCount(run.tokensOut)} />
              <DetailRow label="Cost" value={formatCost(run.costEurMicros)} />
            </dl>
          </section>

          <section className="lp-run-panel">
            <div className="lp-run-panel-head">
              <p className="lp-run-panel-kicker">Scorecard</p>
              <h2 className="lp-run-panel-title">Metrics</h2>
            </div>
            {inFlight && !grade ? (
              <ScorecardSkeleton />
            ) : !grade ? (
              <p className="lp-run-empty">
                Scorecard appears after this run finishes.
              </p>
            ) : metrics.length === 0 ? (
              <p className="lp-run-empty">No metrics on this grade.</p>
            ) : (
              <div className="lp-run-metrics">
                {metrics.map(([key, metric]) => (
                  <div key={key} className="lp-run-metric">
                    <div>
                      <div className="lp-run-metric-name">{key}</div>
                      <div className="lp-run-metric-meta">
                        {metric.hits != null || metric.total != null
                          ? `${metric.hits ?? "—"} / ${metric.total ?? "—"} hits`
                          : "Grade metric"}
                      </div>
                    </div>
                    <div className="lp-run-metric-value">
                      {Number(metric.value).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {grade?.failureClasses && grade.failureClasses.length > 0 ? (
              <p className="lp-run-note lp-run-extra">
                Failure classes: {grade.failureClasses.join(", ")}
              </p>
            ) : null}
            <ScorecardIntervals
              scorecard={grade?.scorecard}
              className="lp-run-note lp-run-extra"
            />
            {typeof grade?.scorecard?.message === "string" ? (
              <p className="lp-run-note lp-run-extra">{grade.scorecard.message}</p>
            ) : null}
          </section>

          {cases.length > 0 ? (
            <section className="lp-run-panel lp-run-panel--wide">
              <div className="lp-run-panel-head">
                <p className="lp-run-panel-kicker">Feedback</p>
                <h2 className="lp-run-panel-title">Failing samples</h2>
              </div>
              <div className="lp-run-table-wrap">
                <table className="lp-run-table">
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Note</th>
                      <th>Gold span</th>
                      <th>Retrieved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((item) => (
                      <FailingRow key={item.question} item={item} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RunDetailSkeleton() {
  return (
    <div className="lp-run" aria-busy="true" aria-label="Loading run">
      <header className="lp-run-hero">
        <div>
          <span className="lp-skel-line" style={{ width: "4rem", height: "0.55rem", marginBottom: "0.65rem" }} />
          <span className="lp-skel-line lp-skel-line--title" style={{ width: "8rem", height: "1.6rem", margin: 0 }} />
          <span className="lp-skel-line" style={{ width: "12rem", height: "0.7rem", marginTop: "0.75rem" }} />
        </div>
        <div className="lp-run-nav">
          <span className="lp-skel-chip lp-skel-chip--sm" />
          <span className="lp-skel-chip lp-skel-chip--sm" />
          <span className="lp-skel-chip lp-skel-chip--sm" />
        </div>
      </header>

      <div className="lp-run-stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="lp-run-stat lp-run-skel-stat">
            <span className="lp-skel-line" />
            <span className="lp-skel-line lp-skel-line--sm" />
          </div>
        ))}
      </div>

      <div className="lp-run-grid">
        <section className="lp-run-panel lp-run-skel-panel">
          <span className="lp-skel-line" />
          <span className="lp-skel-line lp-skel-line--title" />
          <div className="lp-run-skel-rows">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="lp-run-skel-row">
                <span className="lp-skel-line" />
                <span className="lp-skel-line" />
              </div>
            ))}
          </div>
        </section>
        <section className="lp-run-panel lp-run-skel-panel">
          <span className="lp-skel-line" />
          <span className="lp-skel-line lp-skel-line--title" />
          <ScorecardSkeleton />
        </section>
      </div>
    </div>
  );
}

function ScorecardSkeleton() {
  return (
    <div className="lp-run-skel-metrics" aria-hidden="true">
      <div className="lp-run-skel-metric" />
      <div className="lp-run-skel-metric" />
      <div className="lp-run-skel-metric" />
    </div>
  );
}

function Stat({
  label,
  value,
  testId,
  loading,
  tone,
}: {
  label: string;
  value: string | null;
  testId?: string;
  loading?: boolean;
  tone?: "pass" | "fail" | "muted";
}) {
  const pending = Boolean(loading) || value == null;
  return (
    <div className="lp-run-stat">
      {pending ? (
        <span
          className="lp-skel-line"
          style={{ width: "52%", height: "1.15rem", margin: "0.1rem 0 0.15rem", borderRadius: "0.4rem" }}
          aria-hidden="true"
        />
      ) : (
        <p
          className={`lp-run-stat-value${tone ? ` lp-run-stat-value--${tone}` : ""}`}
          data-testid={testId}
        >
          {value}
        </p>
      )}
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

function FailingRow({ item }: { item: FailingCase }) {
  return (
    <tr>
      <td className="lp-run-fail-q">{item.question}</td>
      <td className="lp-run-fail-note">{item.note ?? "—"}</td>
      <td className="lp-run-fail-note">{item.goldSpan ?? "—"}</td>
      <td className="lp-run-fail-note">
        {item.retrieved?.[0]?.slice(0, 180) ?? "—"}
      </td>
    </tr>
  );
}

function verdictTone(verdict?: string | null): "pass" | "fail" | "muted" | undefined {
  if (!verdict) {
    return "muted";
  }
  const value = verdict.toLowerCase();
  if (value === "pass") {
    return "pass";
  }
  if (value === "fail") {
    return "fail";
  }
  return undefined;
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
