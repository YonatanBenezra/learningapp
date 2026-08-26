export class BudgetExceededError extends Error {
  readonly code = 'budget_exceeded';

  constructor(
    readonly runId: string,
    readonly reason: string,
  ) {
    super(reason);
    this.name = 'BudgetExceededError';
  }
}
