"use client";

import { useState } from "react";
import { Check, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolStage } from "@/types/tools";
import {
  simulationsApi,
  type G3Stack,
  type G3StageCheck,
} from "../simulations-api";
import "./tool-lock.css";

/**
 * Staged levels inside a G3 exercise: the stack opens one layer at a time.
 * Each level runs a few fixed messages through the learner's stack; a win
 * opens the next layer. Practice only: the grade is still the hidden set.
 */
export function GuardrailsG3Stages({
  exerciseSlug,
  stages,
  stack,
  disabled,
  onWon,
}: {
  exerciseSlug: string;
  stages: ToolStage[];
  stack: G3Stack;
  disabled?: boolean;
  /** A level was won and opened a tool: read the tools again. */
  onWon?: () => void;
}) {
  const current = stages.find((stage) => stage.state === "current") ?? stages[stages.length - 1];
  const [picked, setPicked] = useState<number | null>(null);
  const level = picked ?? current?.level ?? 1;
  const stage = stages.find((row) => row.level === level) ?? current;
  const [result, setResult] = useState<G3StageCheck | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!stage) {
    return null;
  }
  const shownResult = result?.level === stage.level ? result : null;
  const last = stage.level === stages[stages.length - 1]?.level;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const check = await simulationsApi.g3StageCheck(exerciseSlug, stage.level, stack);
      setResult(check);
      if (check.unlocked.length > 0) {
        onWon?.();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not run this level.");
    } finally {
      setBusy(false);
    }
  }

  const handled = shownResult ? shownResult.results.filter((row) => row.ok).length : 0;

  return (
    <section className="lp-stage" aria-label="Levels">
      <ol className="lp-stage-tabs">
        {stages.map((row) => (
          <li key={row.level}>
            <button
              type="button"
              className={cn("lp-stage-tab", `is-${row.state}`, row.level === stage.level && "is-picked")}
              disabled={row.state === "locked"}
              aria-current={row.level === stage.level ? "step" : undefined}
              onClick={() => setPicked(row.level)}
            >
              <span className="lp-stage-dot" aria-hidden>
                {row.state === "done" ? <Check size={12} strokeWidth={3} /> : row.state === "locked" ? <Lock size={11} /> : row.level}
              </span>
              <span>{row.title}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="lp-stage-card">
        <p className="lp-stage-kicker">
          Level {stage.level} of {stages.length}
          {stage.state === "done" ? " · cleared" : ""}
        </p>
        <p className="lp-stage-goal">{stage.goal}</p>
        <details className="lp-stage-cases" open={stage.state === "current"}>
          <summary>The {stage.cases.length} messages</summary>
          <ul>
            {stage.cases.map((row) => {
              const outcome = shownResult?.results.find((item) => item.id === row.id);
              return (
                <li key={row.id} className={cn(outcome && (outcome.ok ? "is-ok" : "is-miss"))}>
                  <span className={cn("lp-stage-kind", `is-${row.kind}`)}>
                    {row.kind === "attack" ? "Attack" : "Guest"}
                  </span>
                  <pre>{row.text}</pre>
                  {outcome ? (
                    <span className="lp-stage-outcome">
                      {outcome.ok
                        ? row.kind === "attack"
                          ? "Stopped"
                          : "Served"
                        : `Missed: ${outcome.why}`}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </details>
        <div className="lp-stage-run">
          <button
            type="button"
            className="lp-stage-button"
            disabled={disabled || busy}
            onClick={run}
          >
            <Play size={13} aria-hidden />
            {busy ? "Running…" : `Check level ${stage.level}`}
          </button>
          {shownResult ? (
            <span
              className={cn("lp-stage-verdict", shownResult.passed ? "is-pass" : "is-fail")}
              role="status"
            >
              {shownResult.passed
                ? last
                  ? "Cleared. Your stack is ready: submit it to be graded on the hidden set."
                  : "Cleared. The next layer is open."
                : `${handled} of ${shownResult.results.length} handled. Fix the misses and run it again.`}
            </span>
          ) : null}
          {error ? <span className="lp-stage-verdict is-fail">{error}</span> : null}
        </div>
      </div>
    </section>
  );
}
