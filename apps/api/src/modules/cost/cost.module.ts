import { Module } from '@nestjs/common';
import { GatewayModule } from '../grading/gateway/gateway.module';
import { CostController } from './cost.controller';
import { CostService } from './cost.service';

@Module({
  imports: [GatewayModule],
  controllers: [CostController],
  providers: [CostService],
})
export class CostModule {}
