"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatGateNumber, formatGateThreshold, gateMetricLabel, gradedGates } from "../gates";
import { ragLabApi, ragLabErrorMessage } from "../rag-lab/rag-lab-api";
import type { RagLabArchetype, RagLabEstimate } from "../rag-lab/rag-lab-types";
import "../rag-lab.css";

/** Which graded token metric the lab's per-question token count corresponds to. */
const TOKEN_METRIC: Partial<Record<RagLabArchetype, string>> = {
  r1: "mean_context_tokens",
  r2: "mean_prompt_tokens",
  r4: "context_tokens",
  r5: "mean_prompt_tokens",
};

function meanRank(values: Array<number | null>): number | null {
  const ranks = values.filter((value): value is number => value !== null);
  return ranks.length === 0 ? null : ranks.reduce((sum, value) => sum + value, 0) / ranks.length;
}

type RagBudgetMeterProps = {
  slug: string;
  payload: Record<string, unknown>;
  gates?: unknown;
};

/**
 * Live, ungraded read of the current config on the public sample questions:
 * the same token count and answer check the grader applies to the hidden set.
 */
export function RagBudgetMeter({ slug, payload, gates }: RagBudgetMeterProps) {
  const [estimate, setEstimate] = useState<RagLabEstimate | null>(null);
  /** Set for failures worth telling the learner about (sign-in, rate limit, outage). */
  const [failure, setFailure] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const payloadKey = JSON.stringify(payload);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      ragLabApi
        .estimate(slug, JSON.parse(payloadKey) as Record<string, unknown>)
        .then((result) => {
          if (!cancelled) {
            setEstimate(result);
            setFailed(false);
            setFailure(null);
          }
        })
        .catch((caught: unknown) => {
          if (!cancelled) {
            setFailed(true);
            // A half-typed config (400) stays quiet; the form validates on submit.
            const visible =
              !(caught instanceof ApiError) || [401, 429, 503].includes(caught.status);
            setFailure(
              visible ? ragLabErrorMessage(caught, "The public estimate is unavailable.") : null,
            );
          }
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug, payloadKey]);

  if (failed && failure) {
    return (
      <section className="lp-rag-meter" aria-label="Public estimate for the current config">
        <p className="lp-rag-meter-title">
          Public estimate <span>· not graded</span>
        </p>
        <p className="lp-rag-meter-error" role="status">
          {failure}
        </p>
      </section>
    );
  }

  if (failed || !estimate || estimate.questions === 0) {
    return null;
  }

  const tokenMetric = TOKEN_METRIC[estimate.archetype];
  const tokenGate = tokenMetric
    ? (gradedGates(gates).find((gate) => gate.metric === tokenMetric) ?? null)
    : null;
  const tokensOk = tokenGate ? estimate.meanContextTokens <= tokenGate.value : null;
  const budgetPct = tokenGate
    ? Math.min(100, (estimate.meanContextTokens / tokenGate.value) * 100)
    : null;
  const indexGate = gradedGates(gates).find((gate) => gate.metric === "index_chunks") ?? null;
  const indexOk =
    indexGate && estimate.indexChunks !== undefined
      ? estimate.indexChunks <= indexGate.value
      : null;
  const firstStage = meanRank(estimate.rows.map((row) => row.firstStageGoldRank));
  const reranked = meanRank(estimate.rows.map((row) => row.goldRank));

  return (
    <section
      className="lp-rag-meter"
      aria-label="Public estimate for the current config"
    >
      <p className="lp-rag-meter-title">
        Public estimate <span>· {estimate.questions} sample questions · not graded</span>
      </p>
      <div className="lp-rag-meter-row">
        <span className="lp-rag-meter-label">
          {tokenGate ? gateMetricLabel(tokenGate.metric) : "context tokens"}
        </span>
        <span className={cn("lp-rag-meter-value", tokensOk === false && "is-fail", tokensOk && "is-pass")}>
          {formatGateNumber("tokens", estimate.meanContextTokens)}
          {tokenGate ? <small> / {formatGateThreshold(tokenGate)}</small> : null}
        </span>
      </div>
      {budgetPct !== null ? (
        <div className="lp-rag-meter-track" aria-hidden>
          <span
            className={cn("lp-rag-meter-fill", tokensOk ? "is-pass" : "is-fail")}
            style={{ width: `${budgetPct}%` }}
          />
        </div>
      ) : null}
      {indexGate && estimate.indexChunks !== undefined ? (
        <div className="lp-rag-meter-row">
          <span className="lp-rag-meter-label">{gateMetricLabel(indexGate.metric)}</span>
          <span className={cn("lp-rag-meter-value", indexOk ? "is-pass" : "is-fail")}>
            {estimate.indexChunks}
            <small> / {formatGateThreshold(indexGate)}</small>
          </span>
        </div>
      ) : null}
      {estimate.answerable > 0 ? (
        <div className="lp-rag-meter-row">
          <span className="lp-rag-meter-label">answers in context</span>
          <span
            className={cn(
              "lp-rag-meter-value",
              estimate.answersFound === estimate.answerable ? "is-pass" : "is-fail",
            )}
          >
            {estimate.answersFound}/{estimate.answerable}
          </span>
        </div>
      ) : null}
      {firstStage !== null && reranked !== null ? (
        <div className="lp-rag-meter-row">
          <span className="lp-rag-meter-label">mean gold rank</span>
          <span className="lp-rag-meter-value">
            #{firstStage.toFixed(1)} → #{reranked.toFixed(1)}
            <small> first stage → rerank</small>
          </span>
        </div>
      ) : null}
      {estimate.rewriteSkipped ? (
        <p className="lp-rag-meter-note">
          Without your rewrite prompt: the estimate never calls the model. Grading runs the rewrite
          on every question.
        </p>
      ) : null}
    </section>
  );
}
