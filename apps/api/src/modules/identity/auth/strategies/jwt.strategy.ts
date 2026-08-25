import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy {
  validate(_payload: unknown): never {
    throw new NotImplementedException();
  }
}
