import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    return value;
  }
}
