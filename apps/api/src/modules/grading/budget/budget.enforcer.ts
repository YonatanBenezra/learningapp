import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class BudgetEnforcer {
  assertWithinBudget(_runId: string): never {
    throw new NotImplementedException();
  }
}
