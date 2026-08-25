import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class MetricsLibrary {
  recallAtK(_input: unknown): never {
    throw new NotImplementedException();
  }

  ndcgAtK(_input: unknown): never {
    throw new NotImplementedException();
  }

  f1(_input: unknown): never {
    throw new NotImplementedException();
  }

  cohenKappa(_input: unknown): never {
    throw new NotImplementedException();
  }
}
