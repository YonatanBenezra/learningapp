import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class IngestProcessor {
  process(job: unknown): never {
    void job;
    throw new NotImplementedException();
  }
}
