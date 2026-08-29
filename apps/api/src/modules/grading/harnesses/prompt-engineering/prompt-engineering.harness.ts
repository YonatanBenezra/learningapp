import { Injectable } from '@nestjs/common';
import { isPeP1Slug } from '../../../catalogue/exercises/exercises.constants';
import { parseP1Payload } from './pe.payloads';
import type { PeHarnessGradeResult, PeItem } from './pe.types';
import { gradeP1 } from './p1.grade';

export type PeExecuteInput = {
  slug: string;
  runId: string;
  payload: unknown;
  hidden: PeItem[];
  publicItems?: { question: string }[];
};

@Injectable()
export class PromptEngineeringHarness {
  async execute(input: PeExecuteInput): Promise<PeHarnessGradeResult> {
    if (isPeP1Slug(input.slug)) {
      return gradeP1(
        parseP1Payload(input.payload),
        input.hidden,
        input.publicItems ?? [],
      );
    }
    throw new Error(`Unsupported prompt engineering exercise: ${input.slug}`);
  }
}
