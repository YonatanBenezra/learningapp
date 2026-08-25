import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class GradesService {
  getByRunId(_runId: string): never {
    throw new NotImplementedException();
  }
}
