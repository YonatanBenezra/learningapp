import { Injectable } from '@nestjs/common';
import {
  isEvalE1Slug,
  isEvalE2Slug,
  isEvalE3Slug,
} from '../../../catalogue/exercises/exercises.constants';
import { ModelGateway } from '../../gateway/model.gateway';
import { gradeE1 } from './e1.grade';
import { gradeE2 } from './e2.grade';
import { gradeE3 } from './e3.grade';
import type { EvalItem, HarnessGradeResult } from './eval.types';

export type EvalExecuteInput = {
  slug: string;
  runId: string;
  payload: unknown;
  hidden: EvalItem[];
  publicItems?: EvalItem[];
};

@Injectable()
export class EvaluationHarness {
  constructor(private readonly gateway: ModelGateway) {}

  async execute(input: EvalExecuteInput): Promise<HarnessGradeResult> {
    const publicItems = input.publicItems ?? [];
    if (isEvalE1Slug(input.slug)) {
      return gradeE1(parseString(input.payload, 'suiteYaml'), input.hidden, publicItems);
    }
    if (isEvalE2Slug(input.slug)) {
      return gradeE2(
        parseE2(input.payload),
        input.hidden,
        publicItems,
        this.gateway,
        input.runId,
      );
    }
    if (isEvalE3Slug(input.slug)) {
      return gradeE3(
        parseString(input.payload, 'sliceSpecYaml'),
        input.hidden,
        publicItems,
      );
    }
    throw new Error(`Unsupported evaluation exercise: ${input.slug}`);
  }
}

function parseString(payload: unknown, key: string): string {
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload must be an object');
  }
  const value = (payload as Record<string, unknown>)[key];
  if (typeof value !== 'string') {
    throw new Error(`missing ${key}`);
  }
  return value;
}

function parseE2(payload: unknown): { judgeRubric: string; judgePrompt: string } {
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.judgeRubric !== 'string' || typeof record.judgePrompt !== 'string') {
    throw new Error('E2 payload needs judgeRubric and judgePrompt');
  }
  return { judgeRubric: record.judgeRubric, judgePrompt: record.judgePrompt };
}
