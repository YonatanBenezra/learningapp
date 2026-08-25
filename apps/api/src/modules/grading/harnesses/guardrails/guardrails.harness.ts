import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class GuardrailsHarness {
  execute(_input: unknown): never {
    throw new NotImplementedException();
  }
}
