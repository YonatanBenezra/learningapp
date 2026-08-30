"use client";

import Link from "next/link";
import { routes } from "@/config/routes";
import type { FailingCase, Grade } from "@/types/grade";
import type { Run } from "@/types/run";

type RunPanelProps = {
  run: Run | null;
  grade: Grade | null;
  onboarding?: boolean;
};

export function RunPanel({ run, grade, onboarding = false }: RunPanelProps) {
  return (
    <aside className="lp-ws-pane lp-ws-pane--run">
      <div className="lp-ws-pane-head">
        <h2 className="lp-ws-pane-title">Run</h2>
        <p className="lp-ws-pane-lead">Scorecard after you submit.</p>
      </div>
      <div className="lp-ws-pane-body">
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
            <p>Submit a config to grade this exercise.</p>
          </div>
        ) : (
          <p className="lp-ws-status">
            <span className={`lp-ws-status-dot${run.status === "succeeded" ? " is-live" : ""}`} />
            <span>
              Status: <strong>{run.status}</strong>
              {run.errorCode ? ` (${run.errorCode})` : ""}
              {run.errorMessage ? ` — ${run.errorMessage}` : ""}
            </span>
          </p>
        )}
        {run ? (
          <p className="lp-ws-links">
            <Link href={routes.run(run.id)} className="lp-link">
              Run
            </Link>
            <Link href={routes.trace(run.id)} className="lp-link">
              Trace
            </Link>
          </p>
        ) : null}
        {grade ? <Scorecard grade={grade} /> : null}
        {onboarding && grade ? (
          <p className="lp-ws-links">
            <Link href={routes.catalogue} className="lp-link">
              Continue to the catalogue
            </Link>
          </p>
        ) : null}
      </div>
    </aside>
  );
}

function Scorecard({ grade }: { grade: Grade }) {
  const metrics = Object.entries(grade.metrics ?? {});
  const cases = Array.isArray(grade.failingCases) ? grade.failingCases : [];

  return (
    <div className="lp-ws-score">
      <span className={`lp-ws-verdict lp-ws-verdict--${grade.verdict}`} data-testid="verdict">
        {grade.verdict}
      </span>
      {metrics.length > 0 ? (
        <dl className="lp-ws-metrics">
          {metrics.map(([key, metric]) => (
            <div key={key} className="lp-ws-metric">
              <dt>{key}</dt>
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
    </div>
  );
}

function FailingSample({ item }: { item: FailingCase }) {
  return (
    <li className="lp-ws-fail">
      <p>{item.question}</p>
      {item.goldSpan ? (
        <p className="lp-ws-fail-note">Gold span: {item.goldSpan}</p>
      ) : null}
      {item.retrieved && item.retrieved.length > 0 ? (
        <p className="lp-ws-fail-note">
          Retrieved: {item.retrieved[0]?.slice(0, 180)}
        </p>
      ) : null}
    </li>
  );
}
