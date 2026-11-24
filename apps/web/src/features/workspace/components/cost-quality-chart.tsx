"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatGateNumber, gateMetricLabel, gradedGates, type GateSpec } from "../gates";
import type { FigmaBriefSubmission } from "./brief-panel";
import "../cost-quality-chart.css";

/** Quality metrics a RAG grade can carry, in order of preference. */
const QUALITY_METRICS = ["recall@k", "recall@5", "ndcg_improvement", "gold_span_overlap"];

type Point = {
  id: string;
  n: number;
  cost: number;
  quality: number;
  passed: boolean;
};

const W = 320;
const H = 168;
const PAD = { top: 10, right: 12, bottom: 26, left: 36 };

function pickGates(items: ReadonlyArray<FigmaBriefSubmission>) {
  for (const item of items) {
    const gates = gradedGates(item.gateResults);
    const cost = gates.find((gate) => gate.metric.includes("tokens"));
    const quality = QUALITY_METRICS.map((metric) =>
      gates.find((gate) => gate.metric === metric),
    ).find(Boolean);
    if (cost && quality) {
      return { cost, quality };
    }
  }
  return null;
}

function actualFor(item: FigmaBriefSubmission, metric: string): number | null {
  const gate = gradedGates(item.gateResults).find((row) => row.metric === metric);
  return typeof gate?.actual === "number" ? gate.actual : null;
}

/**
 * Each graded attempt as cost (token metric) against quality (recall / nDCG),
 * with the exercise's budget and target drawn in. Status colours carry
 * pass/fail and the tooltip and list below repeat it in words.
 */
export function CostQualityChart({ items }: { items: ReadonlyArray<FigmaBriefSubmission> }) {
  const [hover, setHover] = useState<Point | null>(null);
  const gates = pickGates(items);
  if (!gates) {
    return null;
  }
  const points: Point[] = items
    .map((item) => {
      const cost = actualFor(item, gates.cost.metric);
      const quality = actualFor(item, gates.quality.metric);
      return cost === null || quality === null || item.verdict === null
        ? null
        : { id: item.id, n: item.n, cost, quality, passed: item.verdict === "pass" };
    })
    .filter((point): point is Point => point !== null);
  if (points.length === 0) {
    return null;
  }

  const budget: GateSpec = gates.cost;
  const target: GateSpec = gates.quality;
  const costs = points.map((p) => p.cost);
  const maxCost = Math.max(budget.value, ...costs);
  const minCost = Math.max(1, Math.min(budget.value, ...costs));
  // Token counts span orders of magnitude (a 20-chunk prompt vs one chunk), so
  // switch to a log axis when a linear one would pile every dot at the origin.
  const logX = maxCost / minCost > 6;
  const xLo = logX ? minCost / 1.5 : 0;
  const xHi = maxCost * (logX ? 1.4 : 1.08);
  const plotW = W - PAD.left - PAD.right;
  const x = (value: number) =>
    logX
      ? PAD.left +
        ((Math.log(Math.max(value, xLo)) - Math.log(xLo)) / (Math.log(xHi) - Math.log(xLo))) *
          plotW
      : PAD.left + (value / xHi) * plotW;
  const ratio = target.metric !== "ndcg_improvement";
  const yMin = ratio ? 0 : Math.min(-0.1, ...points.map((p) => p.quality));
  // Headroom above 1.0 so a target of 1.00 and dots on it stay visible.
  const yMax = ratio
    ? 1.08
    : Math.max(0.4, target.value * 1.4, ...points.map((p) => p.quality)) * 1.08;
  const y = (value: number) =>
    PAD.top + (1 - (value - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);
  const costLabel = gateMetricLabel(budget.metric);
  const qualityLabel = gateMetricLabel(target.metric);

  return (
    <figure className="lp-cq-chart">
      <figcaption className="lp-cq-chart-title">
        Cost vs quality
        <span>
          {qualityLabel} by {costLabel}
          {logX ? " (log scale)" : ""}, one dot per graded attempt
        </span>
      </figcaption>
      <div className="lp-cq-chart-plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${points.length} attempts: ${qualityLabel} against ${costLabel}. Budget ${formatGateNumber(budget.metric, budget.value)}, target ${formatGateNumber(target.metric, target.value)}.`}
        >
          {/* Recessive frame: baseline and left axis only. */}
          <line className="lp-cq-axis" x1={PAD.left} x2={W - PAD.right} y1={y(yMin)} y2={y(yMin)} />
          <line className="lp-cq-axis" x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={H - PAD.bottom} />
          {/* Pass region: within budget and at/above target. */}
          <rect
            className="lp-cq-pass-zone"
            x={PAD.left}
            y={PAD.top}
            width={Math.max(0, x(budget.value) - PAD.left)}
            height={Math.max(0, y(target.value) - PAD.top)}
          />
          <line className="lp-cq-limit" x1={x(budget.value)} x2={x(budget.value)} y1={PAD.top} y2={H - PAD.bottom} />
          <line className="lp-cq-limit" x1={PAD.left} x2={W - PAD.right} y1={y(target.value)} y2={y(target.value)} />
          <text className="lp-cq-tick" x={x(budget.value)} y={H - 8} textAnchor="middle">
            {formatGateNumber(budget.metric, budget.value)}
          </text>
          {logX ? null : (
            <text className="lp-cq-tick" x={PAD.left} y={H - 8} textAnchor="middle">
              0
            </text>
          )}
          <text className="lp-cq-tick" x={PAD.left - 5} y={y(target.value) + 3} textAnchor="end">
            {formatGateNumber(target.metric, target.value)}
          </text>
          <text className="lp-cq-tick" x={PAD.left - 5} y={y(yMin) + 3} textAnchor="end">
            {formatGateNumber(target.metric, yMin)}
          </text>
          {points.map((point) => (
            <g
              key={point.id}
              onMouseEnter={() => setHover(point)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(point)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              aria-label={`Attempt ${point.n}: ${costLabel} ${formatGateNumber(budget.metric, point.cost)}, ${qualityLabel} ${formatGateNumber(target.metric, point.quality)}, ${point.passed ? "pass" : "fail"}`}
            >
              {/* Hit target larger than the mark. */}
              <circle cx={x(point.cost)} cy={y(point.quality)} r={10} fill="transparent" />
              <circle
                className={cn("lp-cq-dot", point.passed ? "is-pass" : "is-fail")}
                cx={x(point.cost)}
                cy={y(point.quality)}
                r={hover?.id === point.id ? 6 : 4.5}
              />
            </g>
          ))}
        </svg>
        {hover ? (
          <div
            className="lp-cq-tooltip"
            style={{
              left: `${(x(hover.cost) / W) * 100}%`,
              top: `${(y(hover.quality) / H) * 100}%`,
            }}
            role="status"
          >
            <strong>Attempt {hover.n}</strong> {hover.passed ? "✓ pass" : "✗ fail"}
            <span>
              {costLabel} {formatGateNumber(budget.metric, hover.cost)}
            </span>
            <span>
              {qualityLabel} {formatGateNumber(target.metric, hover.quality)}
            </span>
          </div>
        ) : null}
      </div>
      <p className="lp-cq-legend">
        <span className="lp-cq-key is-pass" aria-hidden /> ✓ pass
        <span className="lp-cq-key is-fail" aria-hidden /> ✗ fail
        <span className="lp-cq-key-zone" aria-hidden /> passing zone
      </p>
    </figure>
  );
}
