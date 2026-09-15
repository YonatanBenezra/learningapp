import { Module } from '@nestjs/common';
import { ContestsModule } from '../contests/contests.module';
import { AssessmentsController } from './assessments.controller';
import { SignedResultsModule } from './signed-results.module';

@Module({
  imports: [ContestsModule, SignedResultsModule],
  controllers: [AssessmentsController],
})
export class AssessmentsModule {}
