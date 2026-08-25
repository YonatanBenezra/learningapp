import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class ProgressService {
  getMine(_userId: string): never {
    throw new NotImplementedException();
  }
}
