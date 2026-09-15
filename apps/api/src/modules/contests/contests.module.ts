import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { SignedResultsModule } from '../assessments/signed-results.module';
import { ContestsController } from './contests.controller';
import { ContestsService } from './contests.service';

@Module({
  imports: [AccountsModule, SignedResultsModule],
  controllers: [ContestsController],
  providers: [ContestsService],
  exports: [ContestsService],
})
export class ContestsModule {}
