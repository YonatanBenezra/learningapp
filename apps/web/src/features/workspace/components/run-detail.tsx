"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { workspaceApi } from "@/features/workspace/workspace-api";
import { ApiError } from "@/lib/api-client";
import type { FailingCase, Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import "@/features/progress/progress.css";
import "../run-detail.css";

type RunDetailProps = {
  runId: string;
};

export function RunDetail({ runId }: RunDetailProps) {
  const [run, setRun] = useState<Run | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [error, setError] = useState<"auth" | "missing" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    workspaceApi
      .getRun(runId)
      .then(async (result) => {
        if (cancelled) {
          return;
        }
        setRun(result);
        if (result.status === "succeeded") {
          try {
            setGrade(await workspaceApi.getGrade(runId));
          } catch {
            setGrade(null);
          }
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
        <p className="lp-pg-note">
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
      <div className="lp-page lp-page-progress">
        <p className="lp-pg-note">Run not found.</p>
      </div>
    );
  }

  if (error === "load") {
    return (
      <div className="lp-page lp-page-progress">
        <p className="lp-pg-note">Could not load this run.</p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="lp-page lp-page-progress">
        <p className="lp-pg-note">Loading…</p>
      </div>
    );
  }

  const metrics = Object.entries(grade?.metrics ?? {});
  const cases = Array.isArray(grade?.failingCases) ? grade.failingCases : [];

  return (
    <div className="lp-page lp-page-progress">
      <header className="lp-run-head">
        <div>
          <h1 className="lp-cat-title">Run</h1>
          <p className="lp-cat-lead">
            {run.title && run.exerciseSlug ? (
              <Link href={routes.exercise(run.exerciseSlug)} className="lp-link">
                {run.title}
              </Link>
            ) : (
              "Scorecard and run details."
            )}
          </p>
        </div>
        <div className="lp-run-links">
          {run.exerciseSlug ? (
            <Link href={routes.exercise(run.exerciseSlug)} className="lp-link">
              Exercise
            </Link>
          ) : null}
          <Link href={routes.trace(run.id)} className="lp-link">
            Trace
          </Link>
          <Link href={routes.progress} className="lp-link">
            Progress
          </Link>
        </div>
      </header>

      <div className="lp-run-stats">
        <Stat label="Status" value={run.status} />
        <Stat
          label="Verdict"
          value={grade?.verdict ?? "—"}
          testId="verdict"
        />
        <Stat
          label="Metrics"
          value={metrics.length ? String(metrics.length) : "—"}
        />
        <Stat label="Cost" value={formatCost(run.costEurMicros)} />
      </div>

      <div className="lp-pg">
        <section className="lp-panel lp-pg-panel">
          <div className="lp-pg-panel-top">
            <p className="lp-panel-eyebrow">Overview</p>
            <h2 className="lp-panel-title">Run details</h2>
          </div>
          <div className="lp-pg-table-wrap">
            <table className="lp-pg-table">
              <tbody>
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
              </tbody>
            </table>
          </div>
        </section>

        <section className="lp-panel lp-pg-panel">
          <div className="lp-pg-panel-top">
            <p className="lp-panel-eyebrow">Scorecard</p>
            <h2 className="lp-panel-title">Metrics</h2>
          </div>
          {!grade ? (
            <p className="lp-pg-empty">
              Scorecard appears after this run finishes.
            </p>
          ) : metrics.length === 0 ? (
            <p className="lp-pg-empty">No metrics on this grade.</p>
          ) : (
            <div className="lp-pg-table-wrap">
              <table className="lp-pg-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Hits</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map(([key, metric]) => (
                    <tr key={key}>
                      <td className="lp-pg-table-skill">{key}</td>
                      <td className="lp-pg-table-score">
                        {Number(metric.value).toFixed(2)}
                      </td>
                      <td>{metric.hits ?? "—"}</td>
                      <td>{metric.total ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {grade?.failureClasses && grade.failureClasses.length > 0 ? (
            <p className="lp-pg-note lp-run-extra">
              Failure classes: {grade.failureClasses.join(", ")}
            </p>
          ) : null}
        </section>

        {cases.length > 0 ? (
          <section className="lp-panel lp-pg-panel">
            <div className="lp-pg-panel-top">
              <p className="lp-panel-eyebrow">Feedback</p>
              <h2 className="lp-panel-title">Failing samples</h2>
            </div>
            <div className="lp-pg-table-wrap">
              <table className="lp-pg-table">
                <thead>
                  <tr>
                    <th>Question</th>
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
  );
}

function Stat({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId?: string;
}) {
  return (
    <div className="lp-pg-stat">
      <span className="lp-pg-stat-value lp-run-stat-value" data-testid={testId}>
        {value}
      </span>
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

function FailingRow({ item }: { item: FailingCase }) {
  return (
    <tr>
      <td className="lp-run-fail-q">{item.question}</td>
      <td className="lp-run-fail-note">{item.goldSpan ?? "—"}</td>
      <td className="lp-run-fail-note">
        {item.retrieved?.[0]?.slice(0, 180) ?? "—"}
      </td>
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
