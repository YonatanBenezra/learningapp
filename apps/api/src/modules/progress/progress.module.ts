import { Module } from '@nestjs/common';
import { ExercisesModule } from '../catalogue/exercises/exercises.module';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [ExercisesModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
