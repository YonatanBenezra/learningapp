"use client";

import { PanelRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/routes";
import type { FailingCase, Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import { cn } from "@/lib/utils";
import { FigmaRagScorecard } from "./figma-rag-scorecard";
import { ScorecardIntervals } from "./scorecard-intervals";
import { InfoTip } from "./info-tip";
import { METRIC_TIPS, metricLabel } from "../rag-lab/rag-lab-copy";
import {
  IconChevronDown,
  IconChevronUp,
  IconTestResult,
} from "./workspace-icons";

type RunPanelProps = {
  run: Run | null;
  grade: Grade | null;
  onboarding?: boolean;
  simulator?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  figmaScorecard?: boolean;
  /** Mobile tab layout: no panel collapse control */
  mobileChrome?: boolean;
};

export function RunPanel({
  run,
  grade,
  onboarding = false,
  simulator,
  collapsed = false,
  onToggleCollapse,
  figmaScorecard = false,
  mobileChrome = false,
}: RunPanelProps) {
  const isRag = simulator === "rag";
  const isGuard = simulator === "guardrails";
  const isScorecard = isRag || isGuard;
  if (collapsed) {
    if (figmaScorecard) {
      return (
        <aside className="lp-ws-pane lp-ws-pane--run is-collapsed lp-ws-pane--run-rail">
          <div className="lp-ws-run-rail">
            <button
              type="button"
              className="lp-ws-run-rail-expand"
              onClick={onToggleCollapse}
              aria-expanded={false}
              aria-label="Expand results panel"
              title="Expand"
            >
              <IconChevronDown size={14} className="-rotate-90" aria-hidden />
            </button>
            <span className="lp-ws-run-rail-icon" aria-hidden>
              <ShieldCheck className="size-4" strokeWidth={2.25} />
            </span>
            <span className="lp-ws-run-rail-label">Test Result</span>
            {grade ? (
              <span
                className={`lp-ws-run-rail-verdict lp-ws-verdict lp-ws-verdict--${grade.verdict}`}
              >
                {grade.verdict}
              </span>
            ) : null}
          </div>
        </aside>
      );
    }

    return (
      <aside className="lp-ws-pane lp-ws-pane--run is-collapsed">
        <button
          type="button"
          className="lp-ws-run-collapsed-bar"
          onClick={onToggleCollapse}
          aria-expanded={false}
        >
          <span className="lp-ws-run-collapsed-icon">
            <IconTestResult size={16} />
          </span>
          <span className="lp-ws-run-collapsed-label">Test Result</span>
          {grade ? (
            <span className={`lp-ws-run-collapsed-verdict lp-ws-verdict lp-ws-verdict--${grade.verdict}`}>
              {grade.verdict}
            </span>
          ) : null}
          <IconChevronUp size={14} />
        </button>
      </aside>
    );
  }

  const figmaRunHeader = figmaScorecard && isScorecard;

  return (
    <aside
      className={cn(
        "lp-ws-pane lp-ws-pane--run flex min-h-0 flex-col",
        figmaScorecard && "lp-ws-pane--figma-run",
      )}
    >
      {figmaRunHeader ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-lp-border px-2.5 py-2">
          <div className="inline-flex min-w-0 items-center gap-2 rounded-md border border-lp-brand/35 bg-[color-mix(in_srgb,var(--color-brand)_6%,var(--color-card))] px-2 py-1">
            <span className="grid size-6 shrink-0 place-items-center rounded text-lp-brand">
              <ShieldCheck className="size-3.5" strokeWidth={2.25} aria-hidden />
            </span>
            <h2 className="m-0 truncate text-[0.8125rem] font-semibold text-lp-ink">
              Test Result
            </h2>
          </div>
          {!mobileChrome && onToggleCollapse ? (
            <button
              type="button"
              className="grid size-7 shrink-0 place-items-center rounded-md border border-lp-border text-lp-muted transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)] hover:text-lp-ink"
              aria-label="Minimize results panel"
              title="Minimize"
              onClick={onToggleCollapse}
            >
              <PanelRight className="size-3.5" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="lp-ws-run-toolbar">
          <div className="lp-ws-run-toolbar-start">
            <span className="lp-ws-run-icon">
              <IconTestResult size={16} />
            </span>
            <h2 className="lp-ws-run-title">
              {isScorecard ? "Test Result" : "Run"}
            </h2>
            {grade ? (
              <span className={`lp-ws-verdict lp-ws-verdict--${grade.verdict}`}>
                {grade.verdict}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            className="lp-ws-icon-btn"
            aria-label="Minimize results panel"
            title="Minimize"
            onClick={onToggleCollapse}
          >
            <IconChevronDown size={14} />
          </button>
        </div>
      )}
      <div
        className={cn(
          "lp-ws-pane-body",
          figmaScorecard && isRag && "min-h-0 overflow-y-auto p-0",
        )}
      >
        {!run ? (
          <div className="lp-ws-empty">
            <span className="lp-ws-empty-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p>
              {isRag
                ? "Run a retrieval grade to see recall and failing samples."
                : isGuard
                  ? "Run a guardrail grade to see block rates and failing samples."
                  : "Submit a config to grade this exercise."}
            </p>
          </div>
        ) : figmaScorecard && isRag ? null : (
          <p className="lp-ws-status">
            <span className={`lp-ws-status-dot${run.status === "succeeded" ? " is-live" : ""}`} />
            <span>
              Status: <strong>{run.status}</strong>
              {run.errorCode ? ` (${run.errorCode})` : ""}
              {run.errorMessage ? ` — ${run.errorMessage}` : ""}
            </span>
          </p>
        )}
        {run && !(figmaScorecard && isRag) ? (
          <p className="lp-ws-links">
            <Link href={routes.run(run.id)} className="lp-link">
              Run
            </Link>
            <Link href={routes.trace(run.id)} className="lp-link">
              Trace
            </Link>
          </p>
        ) : null}
        {grade && figmaScorecard && run && isRag ? (
          <FigmaRagScorecard run={run} grade={grade} />
        ) : grade ? (
          <Scorecard grade={grade} onboarding={onboarding} />
        ) : null}
      </div>
    </aside>
  );
}

function Scorecard({ grade, onboarding = false }: { grade: Grade; onboarding?: boolean }) {
  const metrics = Object.entries(grade.metrics ?? {});
  const cases = Array.isArray(grade.failingCases) ? grade.failingCases : [];

  const headline =
    typeof grade.scorecard?.headline === "string"
      ? grade.scorecard.headline
      : grade.verdict === "fail"
        ? "Below threshold"
        : null;

  return (
    <div className="lp-ws-score">
      {headline ? (
        <div className="lp-ws-score-hero">
          <span className="lp-ws-score-hero-verdict">{grade.verdict}</span>
          <p className="lp-ws-score-hero-title">{headline}</p>
          <p className="lp-ws-score-hero-meta">Run succeeded · Grade complete · 2.4s</p>
        </div>
      ) : (
        <span className={`lp-ws-verdict lp-ws-verdict--${grade.verdict}`} data-testid="verdict">
          {grade.verdict}
        </span>
      )}
      {metrics.length > 0 ? (
        <dl className="lp-ws-metrics">
          {metrics.map(([key, metric]) => (
            <div key={key} className="lp-ws-metric">
              <dt>
                {metricLabel(key)}
                {METRIC_TIPS[key] ? <InfoTip text={METRIC_TIPS[key]} /> : null}
              </dt>
              <dd>{Number(metric.value).toFixed(2)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {grade.failureClasses && grade.failureClasses.length > 0 ? (
        <p className="lp-ws-pane-lead">
          Failure classes: {grade.failureClasses.join(", ")}
        </p>
      ) : null}
      <ScorecardIntervals
        scorecard={grade.scorecard}
        className="lp-ws-pane-lead"
      />
      {typeof grade.scorecard?.message === "string" ? (
        <p className="lp-ws-pane-lead">{grade.scorecard.message}</p>
      ) : null}
      {cases.length > 0 ? (
        <div>
          <h3 className="lp-ws-section-title">Failing samples</h3>
          <ul className="lp-ws-fails">
            {cases.map((item) => (
              <FailingSample key={item.question} item={item} />
            ))}
          </ul>
        </div>
      ) : null}
      {onboarding && grade.verdict === "pass" ? (
        <div className="lp-ws-onboard-win" role="status">
          <p className="lp-ws-onboard-win-kicker">First solve complete</p>
          <p className="lp-ws-onboard-win-title">You read a live scorecard — nice work.</p>
          <p className="lp-ws-onboard-win-copy">
            Explore curated problems or follow a guided path next.
          </p>
          <div className="lp-ws-onboard-win-actions">
            <Link href={routes.problems} className="lp-btn lp-btn-primary">
              Browse problems
            </Link>
            <Link href={routes.paths} className="lp-link">
              Guided paths
            </Link>
          </div>
        </div>
      ) : onboarding && grade.verdict === "fail" ? (
        <div className="lp-ws-onboard-retry" role="status">
          <p className="lp-ws-onboard-win-copy">
            Not a pass yet — tweak chunk size or overlap and submit again. The brief
            on the left has hints.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function FailingSample({ item }: { item: FailingCase }) {
  return (
    <li className="lp-ws-fail">
      <p>{item.question}</p>
      {item.note ? (
        <p className="lp-ws-fail-note">{item.note}</p>
      ) : null}
      {item.retrieved && item.retrieved.length > 0 ? (
        <p className="lp-ws-fail-note">
          Retrieved: {item.retrieved[0]?.slice(0, 180)}
        </p>
      ) : null}
    </li>
  );
}
