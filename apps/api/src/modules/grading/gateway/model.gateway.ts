import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class ModelGateway {
  complete(_input: unknown): never {
    throw new NotImplementedException();
  }

  embed(_input: unknown): never {
    throw new NotImplementedException();
  }
}
