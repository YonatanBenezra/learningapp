"use client";

import { ArrowRight, Lock, X } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { nextRagProblemCta } from "../rag-next-problem";
import {
  recallFromGrade,
  recallHitsTotalFromGrade,
} from "@/features/traces/rag-trace-meta";
import type { FailingCase, Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import { cn } from "@/lib/utils";

type FigmaRagScorecardProps = {
  run: Run;
  grade: Grade;
  attempt?: number;
  exerciseSlug?: string;
};

export function FigmaRagScorecard({
  run,
  grade,
  attempt = 1,
  exerciseSlug,
}: FigmaRagScorecardProps) {
  const passed = grade.verdict === "pass";
  const recall = recallFromGrade(grade) ?? 0;
  const threshold =
    typeof grade.scorecard?.threshold === "number" ? grade.scorecard.threshold : 0.8;
  const { hits, total } = recallHitsTotalFromGrade(grade);
  const failing = grade.failingCases ?? [];
  const totalCases =
    typeof grade.scorecard?.totalCases === "number"
      ? grade.scorecard.totalCases
      : total ?? failing.length + (hits ?? 0);
  const caseIds = Array.isArray(grade.scorecard?.caseIds)
    ? (grade.scorecard.caseIds as string[])
    : null;
  const failCount =
    hits != null && total != null
      ? total - hits
      : typeof grade.scorecard?.failingCount === "number"
        ? grade.scorecard.failingCount
        : failing.length;
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
      : passed
        ? "2.1s"
        : "2.4s";
  const meanTokens = grade.metrics?.meanTokens?.value ?? (passed ? 288 : 312);
  const metricPassed = recall >= threshold;
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
          Run succeeded · Grade complete · {elapsed}
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
            <tr>
              <td className="lp-rag-score-metric-name">recall@5</td>
              <td
                className={cn(
                  "lp-rag-score-metric-value",
                  metricPassed ? "is-pass" : "is-fail",
                )}
              >
                {recall.toFixed(2)}
                {!passed && hits != null && total != null ? (
                  <span className="lp-rag-score-metric-sub">
                    ({hits}/{total})
                  </span>
                ) : null}
              </td>
              <td className="lp-rag-score-metric-threshold">≥ {threshold.toFixed(2)}</td>
              <td className="lp-rag-score-table-status">
                <StatusPill tone={metricPassed ? "pass" : "fail"}>
                  {metricPassed ? "pass" : "fail"}
                </StatusPill>
              </td>
            </tr>
            <tr>
              <td className="lp-rag-score-metric-name">mean tokens</td>
              <td className="lp-rag-score-metric-value">{Math.round(meanTokens)}</td>
              <td className="lp-rag-score-metric-threshold">—</td>
              <td className="lp-rag-score-table-status">
                <StatusPill tone="info">info</StatusPill>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="lp-rag-score-threshold">
        <div className="lp-rag-score-threshold-track" aria-hidden>
          <span
            className={cn(
              "lp-rag-score-threshold-fill",
              metricPassed ? "is-pass" : "is-fail",
            )}
            style={{ width: `${Math.min(100, Math.max(0, recall * 100))}%` }}
          />
          <span
            className="lp-rag-score-threshold-mark"
            style={{ left: `${threshold * 100}%` }}
          />
        </div>
        <div className="lp-rag-score-threshold-labels">
          <span>0</span>
          <span style={{ left: `${threshold * 100}%` }}>{threshold.toFixed(2)}</span>
          <span>1.0</span>
        </div>
      </div>

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
            <span className="lp-rag-score-failures-count">
              {failCount} of {totalCases || "—"} missed
            </span>
          </div>
          {failing.length > 0 ? (
            <ul className="lp-rag-score-failures-list">
              {failing.map((item, index) => (
                <FailingCaseCard
                  key={`${item.question}-${index}`}
                  item={item}
                  id={caseIds?.[index] ?? `q_h_${String(7 + index * 5).padStart(2, "0")}`}
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
          <p className="lp-rag-score-footer-note">Solved in {attempt} attempts</p>
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
    </li>
  );
}
