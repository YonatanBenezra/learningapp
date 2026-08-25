import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class HintsService {
  unlockNext(_slug: string): never {
    throw new NotImplementedException();
  }
}
