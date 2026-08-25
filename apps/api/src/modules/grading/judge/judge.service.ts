import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class JudgeService {
  score(_input: unknown): never {
    throw new NotImplementedException();
  }
}
