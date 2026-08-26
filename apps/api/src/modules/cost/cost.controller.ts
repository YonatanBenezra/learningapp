import { Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CostService } from './cost.service';

@Controller('internal/cost')
export class CostController {
  constructor(private readonly costService: CostService) {}

  @Get()
  summary() {
    return this.costService.summary();
  }

  @Post('over-budget')
  fakeOverBudget(@CurrentUser() user: AuthenticatedUser) {
    return this.costService.fakeOverBudget(user);
  }
}
