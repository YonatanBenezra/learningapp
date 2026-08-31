export type ExerciseBudget = {
  maxModelCalls: number | null;
  maxTokens: number | null;
  maxCostEurMicros: number | null;
  wallClockS: number | null;
};

export type BudgetUsage = {
  calls: number;
  tokens: number;
  costEurMicros: number;
  startedAt: Date | null;
};

export type BudgetDelta = {
  calls: number;
  tokens: number;
  costEurMicros: number;
  sandboxMs?: number;
};

export function parseBudget(raw: unknown): ExerciseBudget {
  const record =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    maxModelCalls: cap(record.max_model_calls),
    maxTokens: cap(record.max_tokens),
    maxCostEurMicros:
      typeof record.max_cost_eur === 'number' &&
      Number.isFinite(record.max_cost_eur)
        ? Math.round(record.max_cost_eur * 1_000_000)
        : null,
    wallClockS: cap(record.wall_clock_s),
  };
}

export function breachReason(
  budget: ExerciseBudget,
  used: BudgetUsage,
  extra: BudgetDelta,
  now = new Date(),
  options: { ignoreWallClock?: boolean } = {},
): string | null {
  if (
    budget.maxModelCalls !== null &&
    used.calls + extra.calls > budget.maxModelCalls
  ) {
    return `max_model_calls ${budget.maxModelCalls}`;
  }
  if (
    budget.maxTokens !== null &&
    used.tokens + extra.tokens > budget.maxTokens
  ) {
    return `max_tokens ${budget.maxTokens}`;
  }
  if (
    budget.maxCostEurMicros !== null &&
    used.costEurMicros + extra.costEurMicros > budget.maxCostEurMicros
  ) {
    return `max_cost_eur ${budget.maxCostEurMicros / 1_000_000}`;
  }
  if (options.ignoreWallClock) {
    return null;
  }
  if (
    budget.wallClockS !== null &&
    extra.sandboxMs !== undefined &&
    extra.sandboxMs > budget.wallClockS * 1000
  ) {
    return `wall_clock_s ${budget.wallClockS}`;
  }
  if (
    budget.wallClockS !== null &&
    used.startedAt &&
    now.getTime() - used.startedAt.getTime() > budget.wallClockS * 1000
  ) {
    return `wall_clock_s ${budget.wallClockS}`;
  }
  return null;
}

function cap(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
