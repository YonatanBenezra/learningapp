"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { FailingCase, Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import { cn } from "@/lib/utils";
import { sampleIndexFromSeed } from "../guardrails-workspace-data";

const FILTER_TOKEN_BUDGET = 600;
const FILTER_CALL_BUDGET = 2;

function metricValue(grade: Grade, key: string): number | null {
  const row = grade.metrics?.[key];
  if (!row || typeof row.value !== "number") {
    return null;
  }
  return row.value;
}

function metricThreshold(grade: Grade, key: string, fallback: number): number {
  const fromScorecard = grade.scorecard?.[key];
  if (typeof fromScorecard === "number") {
    return fromScorecard;
  }
  return fallback;
}

type G3Counts = {
  attackBlocked: number;
  attackN: number;
  benignPassed: number;
  benignN: number;
};

function g3Counts(grade: Grade): G3Counts | null {
  const sc = grade.scorecard;
  if (
    !sc ||
    typeof sc.attackBlocked !== "number" ||
    typeof sc.attackN !== "number" ||
    typeof sc.benignPassed !== "number" ||
    typeof sc.benignN !== "number"
  ) {
    return null;
  }
  return {
    attackBlocked: sc.attackBlocked,
    attackN: sc.attackN,
    benignPassed: sc.benignPassed,
    benignN: sc.benignN,
  };
}

function gradeMetaLine(run: Run, grade: Grade, totalRequests: number | null): string {
  const seed =
    typeof grade.scorecard?.sampleSeed === "string"
      ? grade.scorecard.sampleSeed
      : typeof (grade as { sampleSeed?: string }).sampleSeed === "string"
        ? (grade as { sampleSeed?: string }).sampleSeed
        : null;
  const sample = sampleIndexFromSeed(seed);
  const parts: string[] = [];
  if (sample != null) {
    parts.push(`Graded on sample #${sample}`);
  } else {
    parts.push(`Run ${run.status}`);
  }
  if (totalRequests != null) {
    parts.push(`${totalRequests} requests`);
  }
  const elapsed = grade.scorecard?.elapsedSeconds;
  if (typeof elapsed === "number" && Number.isFinite(elapsed)) {
    parts.push(`${elapsed.toFixed(1)}s`);
  }
  return parts.join(" · ");
}

type FigmaGuardScorecardProps = {
  run: Run;
  grade: Grade;
};

export function FigmaGuardScorecard({ run, grade }: FigmaGuardScorecardProps) {
  const passed = grade.verdict === "pass";
  const attackBlock = metricValue(grade, "attack_block_rate");
  const benignPass = metricValue(grade, "benign_pass_rate");
  const attackNeed = metricThreshold(grade, "attack_block_rate", 0.9);
  const benignNeed = metricThreshold(grade, "benign_pass_rate", 0.95);
  const filterTokens = metricValue(grade, "filter_tokens");
  const filterCalls = metricValue(grade, "added_model_calls") ?? 0;
  const headline =
    typeof grade.scorecard?.headline === "string"
      ? grade.scorecard.headline
      : passed
        ? "Defences held"
        : "Attacks slipped through";
  const failureClass = grade.failureClasses?.[0];
  const counts = g3Counts(grade);
  const totalRequests = counts ? counts.attackN + counts.benignN : null;
  const failing = grade.failingCases ?? [];
  const attackMisses = failing.filter((row) => row.note === "let-through-attack");
  const benignMisses = failing.filter((row) => row.note === "blocked-benign");
  const otherMisses = failing.filter(
    (row) => row.note !== "let-through-attack" && row.note !== "blocked-benign",
  );

  const attackAllowed = counts ? counts.attackN - counts.attackBlocked : 0;
  const benignBlocked = counts ? counts.benignN - counts.benignPassed : 0;

  return (
    <div className="lp-grd-score">
      <div
        className={cn(
          "lp-grd-score-hero",
          passed ? "lp-grd-score-hero--pass" : "lp-grd-score-hero--fail",
        )}
      >
        <div className="lp-grd-score-hero-head">
          <span className="lp-grd-score-verdict-pill">
            <span className="lp-grd-score-verdict-dot" aria-hidden />
            {grade.verdict}
          </span>
          <p className="lp-grd-score-hero-title">{headline}</p>
        </div>
        <p className="lp-grd-score-hero-meta">{gradeMetaLine(run, grade, totalRequests)}</p>
        {failureClass ? (
          <p className="lp-grd-score-failure-class">
            <span>Failure class</span>
            <em>{failureClass}</em>
          </p>
        ) : null}
      </div>

      <div className="lp-grd-score-metrics">
        {attackBlock != null && counts ? (
          <ScoreMetricRow
            label="Attack block rate"
            tone={attackBlock >= attackNeed ? "pass" : "fail"}
            stats={`${counts.attackBlocked}/${counts.attackN} · ${Math.round(attackBlock * 100)}%`}
            needLabel={`need ≥ ${Math.round(attackNeed * 100)}%`}
            barPct={Math.min(100, Math.round(attackBlock * 100))}
          />
        ) : null}

        {benignPass != null && counts ? (
          <ScoreMetricRow
            label="Benign pass rate"
            tone={benignPass >= benignNeed ? "pass" : "fail"}
            stats={`${counts.benignPassed}/${counts.benignN} · ${Math.round(benignPass * 100)}%`}
            needLabel={`need ≥ ${Math.round(benignNeed * 100)}%`}
            barPct={Math.min(100, Math.round(benignPass * 100))}
          />
        ) : null}

        {filterTokens != null ? (
          <ScoreMetricRow
            label="Filter cost"
            tone="neutral"
            stats={`${Math.round(filterCalls)} call · ${Math.round(filterTokens)} tok`}
            needLabel={`budget ≤ ${FILTER_CALL_BUDGET} · ${FILTER_TOKEN_BUDGET}`}
            barPct={Math.min(
              100,
              Math.round(
                Math.max(
                  (filterCalls / FILTER_CALL_BUDGET) * 100,
                  (filterTokens / FILTER_TOKEN_BUDGET) * 100,
                ),
              ),
            )}
          />
        ) : null}
      </div>

      {counts ? (
        <div className="lp-grd-outcome-matrix">
          <div className="lp-grd-outcome-matrix-head">
            <span className="lp-grd-section-label">Outcomes</span>
            <span className="lp-grd-outcome-matrix-total">{totalRequests} requests</span>
          </div>
          <div className="lp-grd-outcome-matrix-grid" role="table" aria-label="Sample outcomes">
            <div className="lp-grd-outcome-matrix-corner" role="row">
              <span role="columnheader" />
              <span role="columnheader">Blocked</span>
              <span role="columnheader">Allowed</span>
            </div>
            <div className="lp-grd-outcome-matrix-row" role="row">
              <span className="lp-grd-outcome-matrix-axis" role="rowheader">
                Attack
              </span>
              <OutcomeCell
                value={counts.attackBlocked}
                caption="correctly blocked"
                variant="good"
              />
              <OutcomeCell
                value={attackAllowed}
                caption="false negatives"
                variant={attackAllowed > 0 ? "bad" : "good-muted"}
              />
            </div>
            <div className="lp-grd-outcome-matrix-row" role="row">
              <span className="lp-grd-outcome-matrix-axis" role="rowheader">
                Benign
              </span>
              <OutcomeCell
                value={benignBlocked}
                caption="false positives"
                variant={benignBlocked > 0 ? "bad" : "good-muted"}
              />
              <OutcomeCell
                value={counts.benignPassed}
                caption="correctly allowed"
                variant="good"
              />
            </div>
          </div>
        </div>
      ) : null}

      {attackMisses.length > 0 ? (
        <FailureAccordion
          title="False negatives · attack allowed"
          count={attackMisses.length}
          cases={attackMisses}
          defaultOpen
        />
      ) : null}
      {benignMisses.length > 0 ? (
        <FailureAccordion
          title="False positives · benign blocked"
          count={benignMisses.length}
          cases={benignMisses}
        />
      ) : null}
      {otherMisses.length > 0 ? (
        <FailureAccordion title="Other failing samples" count={otherMisses.length} cases={otherMisses} />
      ) : null}
    </div>
  );
}

function OutcomeCell({
  value,
  caption,
  variant,
}: {
  value: number;
  caption: string;
  variant: "good" | "bad" | "good-muted";
}) {
  return (
    <div
      className={cn(
        "lp-grd-outcome-cell",
        variant === "good" && "is-good",
        variant === "bad" && "is-bad",
        variant === "good-muted" && "is-good-muted",
      )}
      role="cell"
    >
      <strong>{value}</strong>
      <span>{caption}</span>
    </div>
  );
}

function ScoreMetricRow({
  label,
  tone,
  stats,
  needLabel,
  barPct,
}: {
  label: string;
  tone: "pass" | "fail" | "neutral";
  stats: string;
  needLabel: string;
  barPct: number;
}) {
  return (
    <div className="lp-grd-score-metric">
      <span
        className={cn(
          "lp-grd-score-metric-dot",
          tone === "pass" && "is-pass",
          tone === "fail" && "is-fail",
          tone === "neutral" && "is-neutral",
        )}
        aria-hidden
      />
      <span className="lp-grd-score-metric-label">{label}</span>
      <span
        className={cn(
          "lp-grd-score-metric-stats",
          tone === "pass" && "is-pass",
          tone === "fail" && "is-fail",
          tone === "neutral" && "is-neutral-text",
        )}
      >
        {stats}
      </span>
      <div className="lp-grd-score-metric-bar">
        <span
          className={cn(
            tone === "pass" && "is-pass",
            tone === "fail" && "is-fail",
            tone === "neutral" && "is-neutral",
          )}
          style={{ width: `${barPct}%` }}
        />
      </div>
      <p className="lp-grd-score-metric-need">{needLabel}</p>
    </div>
  );
}

function FailureAccordion({
  title,
  count,
  cases,
  defaultOpen = false,
}: {
  title: string;
  count: number;
  cases: FailingCase[];
  defaultOpen?: boolean;
}) {
  return (
    <details className="lp-grd-score-accordion" open={defaultOpen}>
      <summary>
        <ChevronDown className="size-4 lp-grd-score-accordion-chevron-open" aria-hidden />
        <ChevronRight className="size-4 lp-grd-score-accordion-chevron-closed" aria-hidden />
        <span className="lp-grd-score-accordion-title">{title}</span>
        <span className="lp-grd-score-accordion-count">{count}</span>
      </summary>
      <ul className="lp-grd-score-accordion-list">
        {cases.slice(0, 8).map((row, index) => {
          const sample = row.question ?? row.note ?? "sample";
          const slip = slipReason(row);
          return (
            <li key={index}>
              <div className="lp-grd-score-accordion-panel">
                <code>&ldquo;{truncate(sample, 200)}&rdquo;</code>
                {slip ? <span className="lp-grd-slip">slipped: {slip}</span> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}

function slipReason(row: FailingCase): string | null {
  const output = row.output?.trim();
  if (output && output.length <= 96 && !/^The booking override/i.test(output)) {
    return output;
  }
  if (output && /slipped|defeat|bypass|regex|encoding|leetspeak/i.test(output)) {
    return truncate(output, 96);
  }
  if (row.note && row.note !== "let-through-attack" && row.note !== "blocked-benign") {
    return row.note;
  }
  return output ? truncate(output, 96) : null;
}
