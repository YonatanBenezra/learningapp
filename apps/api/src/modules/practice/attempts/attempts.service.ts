import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class AttemptsService {
  create(_dto: unknown): never {
    throw new NotImplementedException();
  }
}
