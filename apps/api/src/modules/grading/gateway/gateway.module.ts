import { Module } from '@nestjs/common';
import { BudgetEnforcer } from '../budget/budget.enforcer';
import { ModelGateway } from './model.gateway';

@Module({
  providers: [ModelGateway, BudgetEnforcer],
  exports: [ModelGateway, BudgetEnforcer],
})
export class GatewayModule {}
