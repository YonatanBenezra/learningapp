import { Module } from '@nestjs/common';
import { GatewayModule } from '../../grading/gateway/gateway.module';
import { ExercisesController } from './exercises.controller';
import { ExerciseSolveStatsService } from './exercise-solve-stats.service';
import { ExercisesService } from './exercises.service';
import { RagLabController } from './rag-lab.controller';
import { RagLabService } from './rag-lab.service';

@Module({
  imports: [GatewayModule],
  controllers: [ExercisesController, RagLabController],
  providers: [ExercisesService, ExerciseSolveStatsService, RagLabService],
  exports: [ExercisesService, ExerciseSolveStatsService],
})
export class ExercisesModule {}
