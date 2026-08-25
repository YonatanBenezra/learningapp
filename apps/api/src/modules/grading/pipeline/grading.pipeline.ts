import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class GradingPipeline {
  run(_input: unknown): never {
    throw new NotImplementedException();
  }
}
