import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IngestSignatureGuard } from './ingest-signature.guard';
import { IngestService, type UpsertPayload } from './ingest.service';

@Controller('internal/ingest')
@UseGuards(IngestSignatureGuard)
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post('exercises')
  upsertExercises(@Body() payload: UpsertPayload) {
    return this.ingestService.upsertExercises(payload ?? {});
  }
}
