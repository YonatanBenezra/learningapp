import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class RunsService {
  getById(_id: string): never {
    throw new NotImplementedException();
  }

  stream(_id: string): never {
    throw new NotImplementedException();
  }
}
