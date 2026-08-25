import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class JwtRefreshStrategy {
  validate(_payload: unknown): never {
    throw new NotImplementedException();
  }
}
