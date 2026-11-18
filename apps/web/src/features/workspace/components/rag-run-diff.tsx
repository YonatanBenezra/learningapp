"use client";

import { cn } from "@/lib/utils";
import { EVAL_TAG_LABEL } from "../failure-class-copy";
import { gateMetricLabel, gradedGates, type GateSpec } from "../gates";
import { evalBreakdownOf, type EvalBreakdown } from "./rag-eval-breakdown";

/** One graded submission, as the workspace history returns it. */
export type RagRunSnapshot = {
  /** 1-based submission number, oldest first. */
  n: number;
  payload: Record<string, unknown>;
  gateResults: unknown;
  breakdown: unknown;
};

type GateOutcome = Omit<GateSpec, "actual"> & { actual?: number };

function outcomes(gateResults: unknown): GateOutcome[] {
  return gradedGates(gateResults).map((gate) => ({
    ...gate,
    actual: typeof gate.actual === "number" ? gate.actual : undefined,
  }));
}

/** Display a config value; long text (prompts, rules) only says it changed. */
function show(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "—";
  }
  if (typeof value === "string" && value.length > 24) {
    return `${value.length} chars`;
  }
  return String(value);
}

export function configChanges(
  previous: Record<string, unknown>,
  current: Record<string, unknown>,
): { key: string; from: string; to: string }[] {
  const keys = [
    ...new Set([...Object.keys(previous), ...Object.keys(current)]),
  ];
  return keys
    .filter(
      (key) => JSON.stringify(previous[key]) !== JSON.stringify(current[key]),
    )
    .map((key) => {
      const from = previous[key];
      const to = current[key];
      const long =
        typeof from === "string" &&
        typeof to === "string" &&
        (from.length > 24 || to.length > 24);
      return {
        key,
        from: long ? "edited" : show(from),
        to: long ? "" : show(to),
      };
    });
}

function format(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/** Better, worse or unchanged, by the gate's direction. */
function direction(
  gate: GateOutcome,
  before?: number,
  after?: number,
): "up" | "down" | "same" {
  if (
    before === undefined ||
    after === undefined ||
    Math.abs(after - before) < 1e-9
  ) {
    return "same";
  }
  const higherIsBetter =
    gate.op === "gte" || gate.op === "gt" || gate.op === "eq";
  return after > before === higherIsBetter ? "up" : "down";
}

function countChanges(
  previous: EvalBreakdown | null,
  current: EvalBreakdown | null,
) {
  if (!previous || !current) {
    return null;
  }
  const rows: {
    label: string;
    from: string;
    to: string;
    better: boolean | null;
  }[] = [];
  for (const split of ["feedback", "holdout"] as const) {
    const a = previous.bySplit[split];
    const b = current.bySplit[split];
    if (a.hits !== b.hits || a.total !== b.total) {
      rows.push({
        label:
          split === "feedback" ? "Feedback questions" : "Holdout questions",
        from: `${a.hits}/${a.total}`,
        to: `${b.hits}/${b.total}`,
        better: b.hits === a.hits ? null : b.hits > a.hits,
      });
    }
  }
  for (const tag of Object.keys(current.byTag)) {
    const a = previous.byTag[tag];
    const b = current.byTag[tag];
    if (a && b && a.hits !== b.hits) {
      rows.push({
        label: EVAL_TAG_LABEL[tag] ?? tag,
        from: `${a.hits}/${a.total}`,
        to: `${b.hits}/${b.total}`,
        better: b.hits > a.hits,
      });
    }
  }
  return rows;
}

/**
 * This run next to the learner's previous graded submission: what they
 * changed, how each gate moved, and which question groups gained or lost
 * hits. Counts only, so holdout questions stay hidden.
 */
export function RagRunDiff({
  previous,
  current,
}: {
  previous: RagRunSnapshot;
  current: RagRunSnapshot;
}) {
  const changes = configChanges(previous.payload, current.payload);
  const before = new Map(
    outcomes(previous.gateResults).map((gate) => [gate.metric, gate]),
  );
  const gates = outcomes(current.gateResults);
  const counts = countChanges(
    evalBreakdownOf({ breakdown: previous.breakdown }),
    evalBreakdownOf({ breakdown: current.breakdown }),
  );

  return (
    <section className="lp-rag-diff" aria-labelledby="rag-diff-title">
      <h3 id="rag-diff-title" className="lp-rag-score-section-label">
        Since submission #{previous.n}
      </h3>
      <p className="lp-rag-diff-config">
        {changes.length === 0
          ? "Same config as last time."
          : changes.map((change) => (
              <span key={change.key} className="lp-rag-diff-chip">
                <code>{change.key}</code> {change.from}
                {change.to ? ` → ${change.to}` : ""}
              </span>
            ))}
      </p>
      <ul className="lp-rag-diff-list">
        {gates.map((gate) => {
          const old = before.get(gate.metric);
          const move = direction(gate, old?.actual, gate.actual);
          return (
            <li key={gate.metric}>
              <span>{gateMetricLabel(gate.metric)}</span>
              <span className={cn("lp-rag-diff-move", `is-${move}`)}>
                {format(old?.actual)} → {format(gate.actual)}
              </span>
            </li>
          );
        })}
        {(counts ?? []).map((row) => (
          <li key={row.label}>
            <span>{row.label}</span>
            <span
              className={cn(
                "lp-rag-diff-move",
                row.better === null
                  ? "is-same"
                  : row.better
                    ? "is-up"
                    : "is-down",
              )}
            >
              {row.from} → {row.to}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
