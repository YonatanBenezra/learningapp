import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { SimulatorPreviewGuard } from './simulator-preview.guard';
import { SimulatorPreviewService } from './simulator-preview.service';

@Module({
  controllers: [DemoController],
  providers: [SimulatorPreviewService, SimulatorPreviewGuard],
})
export class DemoModule {}
