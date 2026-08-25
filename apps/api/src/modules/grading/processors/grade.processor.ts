import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class GradeProcessor {
  process(_job: unknown): never {
    throw new NotImplementedException();
  }
}
