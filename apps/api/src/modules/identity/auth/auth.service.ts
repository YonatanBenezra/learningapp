import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  requestMagicLink(_email: string): never {
    throw new NotImplementedException();
  }

  consumeMagicLink(_token: string): never {
    throw new NotImplementedException();
  }

  refresh(_token?: string): never {
    throw new NotImplementedException();
  }

  logout(): never {
    throw new NotImplementedException();
  }
}
