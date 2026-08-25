import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class UsersService {
  getMe(_userId: string): never {
    throw new NotImplementedException();
  }
}
