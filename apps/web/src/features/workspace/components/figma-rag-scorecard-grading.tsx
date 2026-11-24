"use client";

import { Check, Loader2, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Run } from "@/types/run";
import { cn } from "@/lib/utils";

type FigmaRagScorecardGradingProps = {
  run: Run;
  pending?: boolean;
};

function formatRunId(id: string): string {
  if (id.length <= 16) {
    return id;
  }
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function FigmaRagScorecardGrading({
  run,
  pending = false,
}: FigmaRagScorecardGradingProps) {
  const [elapsedSec, setElapsedSec] = useState(0);

  const inFlight =
    pending || run.status === "queued" || run.status === "running";

  useEffect(() => {
    if (!inFlight) {
      return;
    }
    setElapsedSec(0);
    const started = Date.now();
    const tick = window.setInterval(() => {
      setElapsedSec(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    }, 500);
    return () => window.clearInterval(tick);
  }, [inFlight, run.id]);

  // Only the run status is real-time; the worker reports no per-step progress,
  // so the steps mirror status rather than simulating chunk/query counts.
  const steps = useMemo(() => {
    const running = run.status === "running";
    return [
      {
        id: "queued",
        label: "Queued for the grading worker",
        state: running ? ("done" as const) : ("active" as const),
      },
      {
        id: "grade",
        label: "Running your config on the hidden set",
        state: running ? ("active" as const) : ("pending" as const),
      },
      {
        id: "score",
        label: "Scoring gates",
        state: "pending" as const,
      },
    ];
  }, [run.status]);

  const queuedLabel =
    run.status === "queued"
      ? `queued ${elapsedSec}s ago`
      : run.status === "running"
        ? `running ${elapsedSec}s`
        : run.status;

  return (
    <div className="lp-grd-score lp-rag-score-grading">
      <div className="lp-rag-score-grading-hero">
        <div className="lp-rag-score-grading-hero-head">
          <span className="lp-rag-score-grading-pill">
            <Loader2 className="lp-rag-score-grading-spin" aria-hidden />
            grading
          </span>
          <p className="lp-rag-score-grading-title">
            {run.status === "running" ? "Grading…" : "Waiting for a worker…"}
          </p>
        </div>
        <p className="lp-rag-score-grading-meta">
          {formatRunId(run.id)} · {queuedLabel}
        </p>
      </div>

      <ol className="lp-rag-score-grading-steps">
        {steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              "lp-rag-score-grading-step",
              step.state === "done" && "is-done",
              step.state === "active" && "is-active",
              step.state === "pending" && "is-pending",
            )}
          >
            <StepIcon state={step.state} />
            <span>{step.label}</span>
          </li>
        ))}
      </ol>

      {run.status === "queued" && elapsedSec >= 30 ? (
        <p className="lp-rag-score-grading-meta" role="status">
          Still queued after {elapsedSec}s. The grading worker may be down.
        </p>
      ) : null}

      <div className="lp-rag-score-grading-skel" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function StepIcon({ state }: { state: "done" | "active" | "pending" }) {
  if (state === "done") {
    return <Check className="lp-rag-score-grading-step-icon" strokeWidth={2.5} aria-hidden />;
  }
  if (state === "active") {
    return (
      <Loader2
        className="lp-rag-score-grading-step-icon lp-rag-score-grading-spin"
        strokeWidth={2.25}
        aria-hidden
      />
    );
  }
  return <Shield className="lp-rag-score-grading-step-icon" strokeWidth={2} aria-hidden />;
}
