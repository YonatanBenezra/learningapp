import { Module } from '@nestjs/common';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';
import { IngestSignatureGuard } from './ingest-signature.guard';

@Module({
  controllers: [IngestController],
  providers: [IngestService, IngestSignatureGuard],
})
export class IngestModule {}
