import { Module } from '@nestjs/common';
import { AccountsModule } from '../../accounts/accounts.module';
import { ContestsModule } from '../../contests/contests.module';
import { ToolsModule } from '../tools/tools.module';
import { ExerciseSubmissionsController } from './exercise-submissions.controller';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  imports: [AccountsModule, ContestsModule, ToolsModule],
  controllers: [SubmissionsController, ExerciseSubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
