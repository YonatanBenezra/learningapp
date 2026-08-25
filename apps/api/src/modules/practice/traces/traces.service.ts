import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class TracesService {
  getByRunId(_runId: string): never {
    throw new NotImplementedException();
  }
}
