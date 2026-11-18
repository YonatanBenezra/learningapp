"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ragLabApi, ragLabErrorMessage } from "../rag-lab/rag-lab-api";
import type {
  RagLabEstimate,
  RagLabEstimateRow,
} from "../rag-lab/rag-lab-types";
import { configChanges } from "./rag-run-diff";

type Probe = { payload: Record<string, unknown>; estimate: RagLabEstimate };
type Probes = { current: Probe | null; previous: Probe | null };

/**
 * The last two probes per exercise. The lab unmounts while the learner edits
 * the config on the Submission tab, so the comparison has to outlive it.
 */
const lastProbes = new Map<string, Probes>();

/** How one public question moved since the previous config. */
function change(
  row: RagLabEstimateRow,
  before?: RagLabEstimateRow,
): {
  label: string;
  tone: "up" | "down" | "same";
} {
  if (!before || row.answerFound === null) {
    return { label: "", tone: "same" };
  }
  if (row.answerFound && !before.answerFound) {
    return { label: "fixed", tone: "up" };
  }
  if (!row.answerFound && before.answerFound) {
    return { label: "broke", tone: "down" };
  }
  if (
    row.goldRank !== before.goldRank &&
    row.goldRank !== null &&
    before.goldRank !== null
  ) {
    return {
      label: `rank ${before.goldRank} → ${row.goldRank}`,
      tone: row.goldRank < before.goldRank ? "up" : "down",
    };
  }
  return { label: "=", tone: "same" };
}

function rankLabel(row: RagLabEstimateRow): string {
  if (row.answerFound === null) {
    return "—";
  }
  const final = row.goldRank === null ? "not in context" : `#${row.goldRank}`;
  return row.firstStageGoldRank !== null &&
    row.firstStageGoldRank !== row.goldRank
    ? `#${row.firstStageGoldRank} → ${final}`
    : final;
}

/**
 * Runs the current config over every public sample question, the same
 * measurement the grader makes, and compares it with the previous config.
 * Public questions only: nothing here comes from the hidden set.
 */
export function RagProbeTable({
  slug,
  payload,
}: {
  slug: string;
  payload: Record<string, unknown>;
}) {
  const [probes, setProbes] = useState<Probes>(
    () => lastProbes.get(slug) ?? { current: null, previous: null },
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const payloadKey = JSON.stringify(payload);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const next = JSON.parse(payloadKey) as Record<string, unknown>;
      setBusy(true);
      ragLabApi
        .estimate(slug, next)
        .then((estimate) => {
          if (!cancelled) {
            setProbes((old) =>
              old.current && JSON.stringify(old.current.payload) === payloadKey
                ? { ...old, current: { payload: next, estimate } }
                : {
                    previous: old.current,
                    current: { payload: next, estimate },
                  },
            );
            setError(null);
          }
        })
        .catch((caught: unknown) => {
          if (!cancelled) {
            setError(
              ragLabErrorMessage(
                caught,
                "The probe could not run on this config.",
              ),
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setBusy(false);
          }
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug, payloadKey]);

  useEffect(() => {
    if (probes.current) {
      lastProbes.set(slug, probes);
    }
  }, [slug, probes]);

  const { current, previous } = probes;
  if (!current) {
    return (
      <p className="lp-rag-lab-empty" role="status">
        {error ??
          (busy
            ? "Running the public questions…"
            : "Adjust the config to probe it.")}
      </p>
    );
  }
  const before = new Map(
    previous?.estimate.rows.map((row) => [row.id, row]) ?? [],
  );
  const rows = current.estimate.rows;
  const moves = rows.map((row) => change(row, before.get(row.id)));
  const fixed = moves.filter((move) => move.label === "fixed").length;
  const broke = moves.filter((move) => move.label === "broke").length;
  const changes = previous
    ? configChanges(previous.payload, current.payload)
    : [];

  return (
    <section
      className="lp-rag-probe"
      aria-label="Probe: public questions under the current config"
    >
      <p className="lp-rag-probe-summary">
        <span>
          Answers in context{" "}
          <strong>
            {current.estimate.answersFound}/{current.estimate.answerable}
          </strong>
        </span>
        <span>
          Mean tokens{" "}
          <strong>{Math.round(current.estimate.meanContextTokens)}</strong>
        </span>
        {previous ? (
          <span>
            Since the last config:{" "}
            <strong className={fixed > 0 ? "is-up" : undefined}>
              {fixed} fixed
            </strong>,{" "}
            <strong className={broke > 0 ? "is-down" : undefined}>
              {broke} broke
            </strong>
          </span>
        ) : null}
        {busy ? <span className="lp-rag-probe-busy">Updating…</span> : null}
      </p>
      {changes.length > 0 ? (
        <p className="lp-rag-diff-config">
          {changes.map((item) => (
            <span key={item.key} className="lp-rag-diff-chip">
              <code>{item.key}</code> {item.from}
              {item.to ? ` → ${item.to}` : ""}
            </span>
          ))}
        </p>
      ) : null}
      {current.estimate.rewriteSkipped ? (
        <p className="lp-rag-meter-note">
          The probe never calls the model, so your rewrite prompt is not applied
          here.
        </p>
      ) : null}
      {error ? (
        <p className="lp-rag-lab-error" role="alert">
          {error}
        </p>
      ) : null}
      <table className="lp-rag-probe-table">
        <thead>
          <tr>
            <th scope="col">Public question</th>
            <th scope="col">Answer</th>
            <th scope="col">Answer rank</th>
            <th scope="col">Tokens</th>
            <th scope="col">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const move = moves[index];
            return (
              <tr key={row.id}>
                <th scope="row">{row.question}</th>
                <td
                  className={cn(
                    row.answerFound === null
                      ? undefined
                      : row.answerFound
                        ? "is-up"
                        : "is-down",
                  )}
                >
                  {row.answerFound === null
                    ? "no key"
                    : row.answerFound
                      ? "in context"
                      : "missed"}
                </td>
                <td>{rankLabel(row)}</td>
                <td>{row.contextTokens}</td>
                <td className={cn(`is-${move.tone}`)}>{move.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
