import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class IngestProcessor {
  process(_job: unknown): never {
    throw new NotImplementedException();
  }
}
