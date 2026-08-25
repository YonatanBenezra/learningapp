import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class SliceSpecParser {
  parse(_yaml: string): never {
    throw new NotImplementedException();
  }
}
