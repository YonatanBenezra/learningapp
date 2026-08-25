import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class SubmissionsService {
  create(_attemptId: string, _dto: unknown): never {
    throw new NotImplementedException();
  }
}
