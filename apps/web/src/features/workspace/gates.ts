import type { GateResult } from "@/types/grade";

/** A gate as declared in exercise meta, or as returned in `grade.gateResults`. */
export type GateSpec = Pick<GateResult, "id" | "class" | "metric" | "op" | "value"> &
  Partial<Pick<GateResult, "actual" | "passed" | "advisory">>;

const OP_SYMBOL: Record<string, string> = {
  gte: "≥",
  gt: ">",
  lte: "≤",
  lt: "<",
  eq: "=",
};

const METRIC_LABELS: Record<string, string> = {
  mean_prompt_tokens: "mean prompt tokens",
  context_tokens: "context tokens",
  ndcg_improvement: "nDCG gain",
  model_calls_per_question: "model calls / question",
  citation_format: "citation format",
  gold_span_overlap: "gold-span overlap",
  unanswerable_refusals: "refusals (unanswerable)",
  answerable_refusals: "refusals (answerable)",
  recall_faq: "recall (FAQ)",
  recall_policy: "recall (policy)",
  recall_procedural: "recall (procedural)",
  flag_captured: "flag captured",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toGate(raw: unknown): GateSpec | null {
  if (!isRecord(raw)) {
    return null;
  }
  const { id, metric, op, value } = raw;
  if (typeof metric !== "string" || typeof op !== "string" || typeof value !== "number") {
    return null;
  }
  return {
    id: typeof id === "string" ? id : metric,
    class: typeof raw.class === "string" ? raw.class : undefined,
    metric,
    op,
    value,
    actual: typeof raw.actual === "number" ? raw.actual : null,
    passed: typeof raw.passed === "boolean" ? raw.passed : null,
    advisory: raw.advisory === true,
  };
}

/**
 * Gates that decide the verdict. Drops advisory (class B, not enforced) gates and the
 * `pass = 1` placeholder some generated exercises still carry.
 */
export function gradedGates(raw: unknown): GateSpec[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map(toGate)
    .filter((gate): gate is GateSpec => gate !== null)
    .filter((gate) => !gate.advisory && gate.metric !== "pass");
}

export function gateMetricLabel(metric: string): string {
  return METRIC_LABELS[metric] ?? metric.replace(/_/g, " ");
}

function isCountMetric(metric: string): boolean {
  return /tokens|calls|refusals/.test(metric);
}

export function formatGateNumber(metric: string, value: number): string {
  if (metric === "flag_captured") {
    return value >= 1 ? "yes" : "no";
  }
  if (isCountMetric(metric)) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(
      Number.isInteger(value) ? value : Math.round(value * 10) / 10,
    );
  }
  return Number.isInteger(value) && Math.abs(value) > 1 ? String(value) : value.toFixed(2);
}

export function formatGateThreshold(gate: Pick<GateSpec, "metric" | "op" | "value">): string {
  return `${OP_SYMBOL[gate.op] ?? gate.op} ${formatGateNumber(gate.metric, gate.value)}`;
}

/** True for 0–1 "higher is better" gates (recall, overlap) that fit a threshold bar. */
export function isRatioGate(gate: GateSpec): boolean {
  return (
    (gate.op === "gte" || gate.op === "gt") &&
    !isCountMetric(gate.metric) &&
    gate.value > 0 &&
    gate.value <= 1
  );
}
