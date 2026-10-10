import { Module } from '@nestjs/common';
import { ExercisesController } from './exercises.controller';
import { ExerciseSolveStatsService } from './exercise-solve-stats.service';
import { ExercisesService } from './exercises.service';
import { RagLabController } from './rag-lab.controller';
import { RagLabService } from './rag-lab.service';

@Module({
  controllers: [ExercisesController, RagLabController],
  providers: [ExercisesService, ExerciseSolveStatsService, RagLabService],
  exports: [ExercisesService, ExerciseSolveStatsService],
})
export class ExercisesModule {}
