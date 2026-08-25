import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class EvaluationHarness {
  execute(_input: unknown): never {
    throw new NotImplementedException();
  }
}
