import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class CanaryNormaliser {
  detect(_text: string): never {
    throw new NotImplementedException();
  }
}
