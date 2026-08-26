import { breachReason, parseBudget, type BudgetUsage } from './budget';

const used: BudgetUsage = {
  calls: 0,
  tokens: 0,
  costEurMicros: 0,
  startedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('budget', () => {
  it('treats a zero call cap as a hard cutoff', () => {
    const budget = parseBudget({
      max_model_calls: 0,
      max_tokens: 0,
      max_cost_eur: 0.02,
      wall_clock_s: 120,
    });
    expect(budget.maxModelCalls).toBe(0);
    expect(
      breachReason(budget, used, { calls: 1, tokens: 10, costEurMicros: 10 }),
    ).toBe('max_model_calls 0');
  });

  it('allows spend under a positive cap', () => {
    const budget = parseBudget({
      max_model_calls: 8,
      max_tokens: 1000,
      max_cost_eur: 0.35,
    });
    expect(
      breachReason(budget, used, { calls: 1, tokens: 20, costEurMicros: 40 }),
    ).toBeNull();
  });

  it('kills when EUR micros would exceed max_cost_eur', () => {
    const budget = parseBudget({ max_cost_eur: 0.00001 });
    expect(
      breachReason(
        budget,
        { ...used, costEurMicros: 8 },
        { calls: 0, tokens: 0, costEurMicros: 5 },
      ),
    ).toBe('max_cost_eur 0.00001');
  });
});
