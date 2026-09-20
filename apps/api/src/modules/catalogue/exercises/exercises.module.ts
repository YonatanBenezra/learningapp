import { Module } from '@nestjs/common';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';
import { RagLabController } from './rag-lab.controller';
import { RagLabService } from './rag-lab.service';

@Module({
  controllers: [ExercisesController, RagLabController],
  providers: [ExercisesService, RagLabService],
  exports: [ExercisesService],
})
export class ExercisesModule {}
