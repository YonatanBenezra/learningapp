import { Injectable } from '@nestjs/common';
import {
  isBenchmarkB1Slug,
  isBenchmarkB2Slug,
  isBenchmarkB3Slug,
} from '../../../catalogue/exercises/exercises.constants';
import { gradeB1 } from './b1.grade';
import { gradeB2 } from './b2.grade';
import { gradeB3 } from './b3.grade';
import type { BenchmarkGradeResult, BenchmarkHidden } from './benchmark.types';

export type BenchmarkExecuteInput = {
  slug: string;
  runId: string;
  payload: unknown;
  hidden: unknown;
  publicItems?: { question: string }[];
};

@Injectable()
export class BenchmarkHarness {
  execute(input: BenchmarkExecuteInput): Promise<BenchmarkGradeResult> {
    const hidden = input.hidden as BenchmarkHidden;
    const publicItems = input.publicItems ?? [];
    if (isBenchmarkB1Slug(input.slug)) {
      return Promise.resolve(gradeB1(input.payload, hidden, publicItems));
    }
    if (isBenchmarkB2Slug(input.slug)) {
      return Promise.resolve(gradeB2(input.payload, hidden, publicItems));
    }
    if (isBenchmarkB3Slug(input.slug)) {
      return Promise.resolve(gradeB3(input.payload, hidden, publicItems));
    }
    return Promise.reject(
      new Error(`Unsupported benchmark exercise: ${input.slug}`),
    );
  }
}
