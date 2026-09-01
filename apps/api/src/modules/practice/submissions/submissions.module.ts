import { Module } from '@nestjs/common';
import { AccountsModule } from '../../accounts/accounts.module';
import { ContestsModule } from '../../contests/contests.module';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  imports: [AccountsModule, ContestsModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
