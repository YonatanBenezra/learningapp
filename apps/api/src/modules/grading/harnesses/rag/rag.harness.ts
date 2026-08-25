import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class RagHarness {
  execute(_input: unknown): never {
    throw new NotImplementedException();
  }
}
