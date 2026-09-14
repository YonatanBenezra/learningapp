import { Module } from '@nestjs/common';
import { ContestsModule } from '../contests/contests.module';
import { AssessmentsController } from './assessments.controller';

@Module({
  imports: [ContestsModule],
  controllers: [AssessmentsController],
})
export class AssessmentsModule {}
