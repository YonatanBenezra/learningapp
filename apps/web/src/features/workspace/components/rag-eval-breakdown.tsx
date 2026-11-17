"use client";

import { EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVAL_TAG_LABEL, failureClassCopy } from "../failure-class-copy";

type HitCount = { hits: number; total: number };

/** Count-only view of the hidden set, as graded (`scorecard.breakdown`). */
export type EvalBreakdown = {
  bySplit: { feedback: HitCount; holdout: HitCount };
  byTag: Record<string, HitCount>;
  diagnosis: Record<string, number>;
  goldRanks: number[];
  cost?: {
    meanTokens: number;
    ceiling: number;
    meanChunks: number;
    meanTokensPerChunk: number;
  };
};

export function evalBreakdownOf(scorecard: unknown): EvalBreakdown | null {
  const value = (scorecard as { breakdown?: unknown } | null)?.breakdown;
  if (!value || typeof value !== "object") {
    return null;
  }
  const row = value as Partial<EvalBreakdown>;
  return row.bySplit && row.byTag && row.diagnosis ? (row as EvalBreakdown) : null;
}

function rate({ hits, total }: HitCount): string {
  return total === 0 ? "—" : `${hits}/${total}`;
}

function rangeLabel(ranks: number[]): string {
  if (ranks.length === 0) {
    return "";
  }
  const min = ranks[0];
  const max = ranks[ranks.length - 1];
  return min === max ? `${min}` : `${min}–${max}`;
}

/** Why the misses happened, from the grader's evidence. Fail state only. */
export function RagMissEvidence({ breakdown }: { breakdown: EvalBreakdown }) {
  const causes = Object.entries(breakdown.diagnosis).sort((a, b) => b[1] - a[1]);
  const cost = breakdown.cost;
  const overBudget = cost ? cost.meanTokens > cost.ceiling : false;
  if (causes.length === 0 && !overBudget) {
    return null;
  }
  return (
    <section className="lp-rag-evidence" aria-labelledby="rag-evidence-title">
      <h3 id="rag-evidence-title" className="lp-rag-score-section-label">
        Why it missed
      </h3>
      <ul className="lp-rag-evidence-list">
        {overBudget && cost ? (
          <li>
            <span className="lp-rag-evidence-count">budget</span>
            <span>
              Mean context {Math.round(cost.meanTokens)} tokens ≈{" "}
              {cost.meanChunks.toFixed(1)} chunks × {Math.round(cost.meanTokensPerChunk)}{" "}
              tokens, over the {cost.ceiling}-token budget.
            </span>
          </li>
        ) : null}
        {causes.map(([code, count]) => (
          <li key={code}>
            <span className="lp-rag-evidence-count">×{count}</span>
            <span>
              {failureClassCopy(code) ?? code}
              {code.endsWith("gold-ranked-below-k") && breakdown.goldRanks.length > 0 ? (
                <span className="lp-rag-evidence-sub">
                  {" "}
                  First-stage rank of the answer: {rangeLabel(breakdown.goldRanks)}.
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Per-split and per-tag hit counts. Holdout questions are never shown. */
export function RagHiddenSetBreakdown({ breakdown }: { breakdown: EvalBreakdown }) {
  const tags = Object.entries(breakdown.byTag).sort((a, b) => b[1].total - a[1].total);
  const { feedback, holdout } = breakdown.bySplit;
  return (
    <section className="lp-rag-hidden-set" aria-labelledby="rag-hidden-set-title">
      <h3 id="rag-hidden-set-title" className="lp-rag-score-section-label">
        Hidden set
      </h3>
      <p className="lp-rag-hidden-set-split">
        <span>
          Feedback questions <strong>{rate(feedback)}</strong>
        </span>
        <span className="lp-rag-hidden-set-holdout">
          <EyeOff className="size-3 shrink-0" aria-hidden />
          Holdout (never shown) <strong>{rate(holdout)}</strong>
        </span>
      </p>
      {tags.length > 0 ? (
        <table className="lp-rag-hidden-set-tags">
          <caption className="sr-only">Hits per question type</caption>
          <tbody>
            {tags.map(([tag, count]) => {
              const share = count.total === 0 ? 0 : count.hits / count.total;
              return (
                <tr key={tag}>
                  <th scope="row">{EVAL_TAG_LABEL[tag] ?? tag}</th>
                  <td className="lp-rag-hidden-set-bar-cell">
                    <span className="lp-rag-hidden-set-bar" aria-hidden>
                      <span
                        className={cn(
                          "lp-rag-hidden-set-bar-fill",
                          share < 1 ? "is-partial" : "is-full",
                        )}
                        style={{ width: `${Math.round(share * 100)}%` }}
                      />
                    </span>
                  </td>
                  <td className="lp-rag-hidden-set-count">{rate(count)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
