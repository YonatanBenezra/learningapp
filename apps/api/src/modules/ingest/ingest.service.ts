import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class IngestService {
  upsertExercises(_payload: unknown): never {
    throw new NotImplementedException();
  }
}
