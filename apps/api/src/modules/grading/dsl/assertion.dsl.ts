import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class AssertionDsl {
  evaluate(_suite: unknown, _output: unknown): never {
    throw new NotImplementedException();
  }
}
