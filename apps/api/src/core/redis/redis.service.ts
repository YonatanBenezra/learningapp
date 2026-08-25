import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class RedisService {
  getClient(): never {
    throw new NotImplementedException();
  }
}
