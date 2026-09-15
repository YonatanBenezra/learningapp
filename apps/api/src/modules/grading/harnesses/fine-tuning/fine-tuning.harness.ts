import { Injectable } from '@nestjs/common';
import {
  isFtF1Slug,
  isFtF2Slug,
  isFtF3Slug,
  isFtF4Slug,
  isFtF5Slug,
} from '../../../catalogue/exercises/exercises.constants';
import { gradeF1 } from './f1.grade';
import { gradeF2 } from './f2.grade';
import { gradeF3 } from './f3.grade';
import { gradeF4 } from './f4.grade';
import { gradeF5 } from './f5.grade';

export type FineTuningExecuteInput = {
  slug: string;
  runId: string;
  payload: unknown;
  hidden: unknown;
  publicItems?: { question: string }[];
};

@Injectable()
export class FineTuningHarness {
  execute(input: FineTuningExecuteInput) {
    const publicItems = input.publicItems ?? [];
    if (isFtF1Slug(input.slug)) {
      return Promise.resolve(gradeF1(input.payload, input.hidden, publicItems));
    }
    if (isFtF2Slug(input.slug)) {
      return Promise.resolve(gradeF2(input.payload, input.hidden, publicItems));
    }
    if (isFtF3Slug(input.slug)) {
      return Promise.resolve(gradeF3(input.payload, input.hidden, publicItems));
    }
    if (isFtF4Slug(input.slug)) {
      return Promise.resolve(gradeF4(input.payload, input.hidden, publicItems));
    }
    if (isFtF5Slug(input.slug)) {
      return Promise.resolve(gradeF5(input.payload, input.hidden, publicItems));
    }
    return Promise.reject(
      new Error(`Unsupported fine-tuning exercise: ${input.slug}`),
    );
  }
}
