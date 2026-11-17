"use client";

import { ArrowRight, Lock, X } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { nextRagProblemCta } from "../rag-next-problem";
import {
  formatGateNumber,
  formatGateThreshold,
  gateMetricLabel,
  gradedGates,
  isRatioGate,
  type GateSpec,
} from "../gates";
import { recallHitsTotalFromGrade } from "@/features/traces/rag-trace-meta";
import type { FailingCase, Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import { cn } from "@/lib/utils";

type FigmaRagScorecardProps = {
  run: Run;
  grade: Grade;
  /** Submissions made in this workspace session, including the graded one. */
  attempt?: number;
  exerciseSlug?: string;
};

type ScoreRow = {
  key: string;
  label: string;
  actual: string;
  threshold: string;
  tone: "pass" | "fail" | "info";
  sub?: string;
};

function elapsedFromRun(run: Run): string | null {
  if (!run.startedAt || !run.finishedAt) {
    return null;
  }
  const ms = Date.parse(run.finishedAt) - Date.parse(run.startedAt);
  return Number.isFinite(ms) && ms >= 0 ? `${(ms / 1000).toFixed(1)}s` : null;
}

function isRecallMetric(metric: string): boolean {
  return metric.startsWith("recall");
}

function rowsFromGates(
  gates: GateSpec[],
  recallCounts: { hits?: number; total?: number },
): ScoreRow[] {
  return gates.map((gate) => ({
    key: gate.id ?? gate.metric,
    label: gateMetricLabel(gate.metric),
    actual: typeof gate.actual === "number" ? formatGateNumber(gate.metric, gate.actual) : "—",
    threshold: formatGateThreshold(gate),
    tone: gate.passed === true ? "pass" : gate.passed === false ? "fail" : "info",
    sub:
      isRecallMetric(gate.metric) &&
      recallCounts.hits != null &&
      recallCounts.total != null
        ? `(${recallCounts.hits}/${recallCounts.total})`
        : undefined,
  }));
}

/** Older grades without `gateResults`: show raw metrics, without inventing thresholds. */
function rowsFromMetrics(grade: Grade): ScoreRow[] {
  return Object.entries(grade.metrics ?? {}).map(([key, metric]) => ({
    key,
    label: gateMetricLabel(key),
    actual: formatGateNumber(key, Number(metric.value)),
    threshold: "—",
    tone: "info",
  }));
}

export function FigmaRagScorecard({
  run,
  grade,
  attempt,
  exerciseSlug,
}: FigmaRagScorecardProps) {
  const passed = grade.verdict === "pass";
  const gates = gradedGates(grade.gateResults);
  const recallCounts = recallHitsTotalFromGrade(grade);
  const rows =
    gates.length > 0 ? rowsFromGates(gates, recallCounts) : rowsFromMetrics(grade);
  const barGate = gates.find(isRatioGate);
  const barActual = typeof barGate?.actual === "number" ? barGate.actual : null;
  const barPassed = barGate?.passed === true;
  const failing = grade.failingCases ?? [];
  const caseIds = Array.isArray(grade.scorecard?.caseIds)
    ? (grade.scorecard.caseIds as string[])
    : null;
  const { hits, total } = recallCounts;
  const missSummary =
    hits != null && total != null
      ? `${total - hits} of ${total} missed`
      : failing.length > 0
        ? `${failing.length} sample${failing.length === 1 ? "" : "s"} shown`
        : null;
  const failureClass = grade.failureClasses?.[0];
  const failureDetail =
    typeof grade.scorecard?.failureDetail === "string"
      ? grade.scorecard.failureDetail
      : null;
  const headline =
    typeof grade.scorecard?.headline === "string"
      ? grade.scorecard.headline
      : passed
        ? "Accepted"
        : "Below threshold";
  const elapsed =
    typeof grade.scorecard?.elapsedSeconds === "number"
      ? `${grade.scorecard.elapsedSeconds.toFixed(1)}s`
      : elapsedFromRun(run);
  const nextCta = exerciseSlug ? nextRagProblemCta(exerciseSlug) : null;

  return (
    <div
      className={cn(
        "lp-grd-score lp-rag-score",
        passed ? "lp-rag-score--pass" : "lp-rag-score--fail",
      )}
    >
      <div
        className={cn(
          "lp-grd-score-hero",
          passed
            ? "lp-grd-score-hero--pass lp-rag-score-hero--accepted"
            : "lp-grd-score-hero--fail lp-rag-score-hero--fail",
        )}
      >
        <div className="lp-grd-score-hero-head">
          <span className="lp-grd-score-verdict-pill">
            <span className="lp-grd-score-verdict-dot" aria-hidden />
            {grade.verdict}
          </span>
          <p className="lp-grd-score-hero-title">{headline}</p>
        </div>
        <p className="lp-grd-score-hero-meta">
          Run succeeded · Grade complete{elapsed ? ` · ${elapsed}` : ""}
        </p>
        <nav className="lp-rag-score-hero-links" aria-label="Run links">
          <Link href={routes.run(run.id)}>Run</Link>
          <Link href={routes.trace(run.id)}>Trace →</Link>
        </nav>
      </div>

      <div className="lp-rag-score-table-wrap">
        <table className="lp-rag-score-table">
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Yours</th>
              <th scope="col">Threshold</th>
              <th scope="col" className="lp-rag-score-table-status">
                <span className="sr-only">Status</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.key}>
                  <td className="lp-rag-score-metric-name">{row.label}</td>
                  <td
                    className={cn(
                      "lp-rag-score-metric-value",
                      row.tone === "pass" && "is-pass",
                      row.tone === "fail" && "is-fail",
                    )}
                  >
                    {row.actual}
                    {row.sub ? (
                      <span className="lp-rag-score-metric-sub">{row.sub}</span>
                    ) : null}
                  </td>
                  <td className="lp-rag-score-metric-threshold">{row.threshold}</td>
                  <td className="lp-rag-score-table-status">
                    <StatusPill tone={row.tone}>{row.tone}</StatusPill>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="lp-rag-score-metric-name" colSpan={4}>
                  No metrics were recorded for this grade.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {barGate && barActual != null ? (
        <div className="lp-rag-score-threshold">
          <div className="lp-rag-score-threshold-track" aria-hidden>
            <span
              className={cn(
                "lp-rag-score-threshold-fill",
                barPassed ? "is-pass" : "is-fail",
              )}
              style={{ width: `${Math.min(100, Math.max(0, barActual * 100))}%` }}
            />
            <span
              className="lp-rag-score-threshold-mark"
              style={{ left: `${barGate.value * 100}%` }}
            />
          </div>
          <div className="lp-rag-score-threshold-labels">
            <span>0</span>
            <span style={{ left: `${barGate.value * 100}%` }}>
              {barGate.value.toFixed(2)}
            </span>
            {/* Drop the end label when the threshold label would overlap it. */}
            {barGate.value <= 0.85 ? <span>1.0</span> : null}
          </div>
        </div>
      ) : null}

      {!passed && failureClass ? (
        <section className="lp-rag-score-failure-block">
          <h3 className="lp-rag-score-section-label">Failure class</h3>
          <code className="lp-rag-score-failure-code">{failureClass}</code>
          {failureDetail ? (
            <p className="lp-rag-score-failure-detail">{failureDetail}</p>
          ) : null}
        </section>
      ) : null}

      {!passed ? (
        <section className="lp-rag-score-failures">
          <div className="lp-rag-score-failures-head">
            <h3 className="lp-rag-score-section-label">Failing cases</h3>
            {missSummary ? (
              <span className="lp-rag-score-failures-count">{missSummary}</span>
            ) : null}
          </div>
          {failing.length > 0 ? (
            <ul className="lp-rag-score-failures-list">
              {failing.map((item, index) => (
                <FailingCaseCard
                  key={`${item.question}-${index}`}
                  item={item}
                  id={caseIds?.[index] ?? `Miss ${index + 1}`}
                />
              ))}
            </ul>
          ) : (
            <p className="lp-rag-score-failures-empty">
              No sample misses attached to this grade.
            </p>
          )}
        </section>
      ) : null}

      {passed && nextCta ? (
        <footer className="lp-rag-score-footer">
          {attempt != null && attempt > 0 ? (
            <p className="lp-rag-score-footer-note">
              Solved in {attempt} attempt{attempt === 1 ? "" : "s"}
            </p>
          ) : null}
          <Link href={nextCta.href} className="lp-rag-score-next">
            {nextCta.label}
            <ArrowRight className="size-3.5" strokeWidth={2.25} aria-hidden />
          </Link>
        </footer>
      ) : null}
    </div>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: "fail" | "pass" | "info";
  children: string;
}) {
  return (
    <span
      className={cn(
        "lp-rag-score-pill",
        tone === "fail" && "is-fail",
        tone === "pass" && "is-pass",
        tone === "info" && "is-info",
      )}
    >
      {tone !== "info" ? <span className="lp-rag-score-pill-dot" aria-hidden /> : null}
      {children}
    </span>
  );
}

function FailingCaseCard({ item, id }: { item: FailingCase; id: string }) {
  return (
    <li className="lp-rag-score-failure-card">
      <div className="lp-rag-score-failure-card-head">
        <span className="lp-rag-score-failure-id">{id}</span>
        <span className="lp-rag-score-failure-tag">
          <Lock className="size-3 shrink-0 opacity-80" aria-hidden />
          gold hidden
        </span>
      </div>
      <p className="lp-rag-score-failure-q">{item.question}</p>
      {item.note ? (
        <p className="lp-rag-score-failure-note">
          <X className="size-3.5 shrink-0 stroke-[2.5]" aria-hidden />
          <span>{item.note}</span>
        </p>
      ) : null}
      {item.answer ? (
        <p className="lp-rag-score-failure-answer">
          <span className="lp-rag-score-failure-answer-label">Model answered</span>
          {item.answer}
        </p>
      ) : null}
    </li>
  );
}
