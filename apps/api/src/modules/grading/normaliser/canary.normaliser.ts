import { Injectable } from '@nestjs/common';
import {
  CANARY_ENCODINGS,
  detectCanary,
  encodeCanary,
  type CanaryEncoding,
} from './encodings';

@Injectable()
export class CanaryNormaliser {
  readonly version = 'canary-norm-v1';
  readonly encodings = CANARY_ENCODINGS;

  encode(canary: string, encoding: CanaryEncoding): string {
    return encodeCanary(canary, encoding);
  }

  detect(
    text: string,
    canary: string,
    encodings: readonly CanaryEncoding[] = CANARY_ENCODINGS,
  ): CanaryEncoding | null {
    return detectCanary(text, canary, encodings);
  }
}
