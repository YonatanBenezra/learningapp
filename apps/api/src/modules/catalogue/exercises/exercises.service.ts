import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class ExercisesService {
  list(_query: unknown): never {
    throw new NotImplementedException();
  }

  getBySlug(_slug: string): never {
    throw new NotImplementedException();
  }
}
