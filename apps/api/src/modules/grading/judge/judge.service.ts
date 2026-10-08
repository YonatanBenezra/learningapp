import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class JudgeService {
  score(): never {
    throw new NotImplementedException();
  }
}
