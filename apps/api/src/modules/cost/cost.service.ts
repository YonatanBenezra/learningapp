import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class CostService {
  summary(): never {
    throw new NotImplementedException();
  }
}
