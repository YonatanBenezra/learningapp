import { Injectable } from '@nestjs/common';
import {
  R3_SLUG,
  R4_SLUG,
  isRagR1Slug,
  isRagR2Slug,
} from '../../../catalogue/exercises/exercises.constants';
import { ModelGateway } from '../../gateway/model.gateway';
import type { CorpusDoc } from './chunking';
import { parseR1Payload, parseR2Payload, parseR3Payload, parseR4Payload } from './rag.payloads';
import { gradeR1 } from './r1.grade';
import { gradeR2 } from './r2.grade';
import { gradeR3 } from './r3.grade';
import { gradeR4 } from './r4.grade';
import type { HiddenItem, RagGradeResult } from './rag.types';

export type RagExecuteInput = {
  slug: string;
  runId: string;
  payload: unknown;
  docs: CorpusDoc[];
  hidden: HiddenItem[];
  publicItems?: { question: string }[];
};

@Injectable()
export class RagHarness {
  constructor(private readonly gateway: ModelGateway) {}

  async execute(input: RagExecuteInput): Promise<RagGradeResult> {
    const publicItems = input.publicItems ?? [];
    if (isRagR1Slug(input.slug)) {
      return gradeR1(
        parseR1Payload(input.payload),
        input.docs,
        input.hidden,
        publicItems,
      );
    }
    if (isRagR2Slug(input.slug)) {
      return gradeR2(
        parseR2Payload(input.payload),
        input.docs,
        input.hidden,
        publicItems,
      );
    }
    if (input.slug === R3_SLUG) {
      return gradeR3(
        parseR3Payload(input.payload),
        input.docs,
        input.hidden,
        publicItems,
        this.gateway,
        input.runId,
      );
    }
    if (input.slug === R4_SLUG) {
      return gradeR4(
        parseR4Payload(input.payload),
        input.docs,
        input.hidden,
        publicItems,
        this.gateway,
        input.runId,
      );
    }
    throw new Error(`Unsupported RAG exercise: ${input.slug}`);
  }
}

export { parseRagPayload } from './rag.payloads';
