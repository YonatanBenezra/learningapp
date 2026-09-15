import { gradeB1 } from '../benchmark/b1.grade';
import type { F3GradeResult } from './fine-tuning.types';

export function gradeF3(
  payload: unknown,
  hiddenRaw: unknown,
  publicItems: { question: string }[] = [],
): F3GradeResult {
  const result = gradeB1(payload, hiddenRaw, publicItems);
  const mapped: F3GradeResult = {
    ...result,
    trace: {
      ...result.trace,
      simulator: 'fine_tuning',
    },
  };
  if (JSON.stringify(mapped).includes('HIDDEN_EVAL')) {
    return {
      ...mapped,
      verdict: 'fail',
      failureClasses: [...new Set([...mapped.failureClasses, 'canary-leak'])],
    };
  }
  return mapped;
}
