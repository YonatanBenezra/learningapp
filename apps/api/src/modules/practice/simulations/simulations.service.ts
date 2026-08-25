import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class SimulationsService {
  g1Turn(_dto: unknown): never {
    throw new NotImplementedException();
  }

  g2Submit(_payload: unknown): never {
    throw new NotImplementedException();
  }
}
