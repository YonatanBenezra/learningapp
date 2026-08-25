import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class SkillsService {
  list(): never {
    throw new NotImplementedException();
  }
}
