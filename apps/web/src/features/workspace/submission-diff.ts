import { formatGateNumber, gateMetricLabel, gradedGates, type GateSpec } from "./gates";

export type ConfigChange = { key: string; from: string; to: string };

export type GateDelta = {
  metric: string;
  label: string;
  from: string;
  to: string;
  /** Moved toward passing (lower for ≤ gates, higher for ≥ gates). */
  trend: "better" | "worse" | "same";
  passedNow: boolean | null;
};

function show(value: unknown): string {
  if (value === undefined) {
    return "—";
  }
  if (typeof value === "string") {
    return value.length > 40 ? `${value.slice(0, 37)}…` : value;
  }
  return JSON.stringify(value);
}

/** Fields whose value changed between two submitted configs. */
export function configChanges(
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
): ConfigChange[] {
  const keys = [...new Set([...Object.keys(previous), ...Object.keys(next)])];
  return keys
    .filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]))
    .map((key) => ({ key, from: show(previous[key]), to: show(next[key]) }));
}

function trendFor(gate: GateSpec, from: number, to: number): GateDelta["trend"] {
  if (from === to) {
    return "same";
  }
  const lowerIsBetter = gate.op === "lte" || gate.op === "lt";
  return (to < from) === lowerIsBetter ? "better" : "worse";
}

/** Per-gate movement between two graded submissions. */
export function gateDeltas(previousGates: unknown, nextGates: unknown): GateDelta[] {
  const before = new Map(gradedGates(previousGates).map((gate) => [gate.metric, gate]));
  return gradedGates(nextGates)
    .filter((gate) => typeof gate.actual === "number")
    .map((gate) => {
      const prior = before.get(gate.metric);
      const to = gate.actual as number;
      const from = typeof prior?.actual === "number" ? prior.actual : null;
      return {
        metric: gate.metric,
        label: gateMetricLabel(gate.metric),
        from: from === null ? "—" : formatGateNumber(gate.metric, from),
        to: formatGateNumber(gate.metric, to),
        trend: from === null ? "same" : trendFor(gate, from, to),
        passedNow: typeof gate.passed === "boolean" ? gate.passed : null,
      };
    });
}

/** "recall@k 1.00 · mean prompt tokens 99" for a graded submission. */
export function gateSummary(gateResults: unknown): string {
  return gradedGates(gateResults)
    .filter((gate) => typeof gate.actual === "number")
    .map(
      (gate) =>
        `${gateMetricLabel(gate.metric)} ${formatGateNumber(gate.metric, gate.actual as number)}`,
    )
    .join(" · ");
}
