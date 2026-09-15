import { Module } from '@nestjs/common';
import { SignedResultsController } from './signed-results.controller';
import { SignedResultsService } from './signed-results.service';

@Module({
  controllers: [SignedResultsController],
  providers: [SignedResultsService],
  exports: [SignedResultsService],
})
export class SignedResultsModule {}
