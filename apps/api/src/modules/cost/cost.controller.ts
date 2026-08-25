import { Controller, Get } from '@nestjs/common';
import { CostService } from './cost.service';

@Controller('internal/cost')
export class CostController {
  constructor(private readonly costService: CostService) {}

  @Get()
  summary() {
    return this.costService.summary();
  }
}
