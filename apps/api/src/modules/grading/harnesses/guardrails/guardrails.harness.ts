import { Injectable } from '@nestjs/common';
import {
  isGuardG1Slug,
  isGuardG2Slug,
  isGuardG3Slug,
} from '../../../catalogue/exercises/exercises.constants';
import { ModelGateway } from '../../gateway/model.gateway';
import { gradeG1 } from './g1.grade';
import { gradeG2 } from './g2.grade';
import { gradeG3 } from './g3.grade';
import type { GuardrailsGradeResult } from './guardrails.types';

export type GuardrailsExecuteInput = {
  slug: string;
  runId: string;
  payload: unknown;
  hidden: unknown;
  publicItems?: unknown[];
};

@Injectable()
export class GuardrailsHarness {
  constructor(private readonly gateway: ModelGateway) {}

  async execute(input: GuardrailsExecuteInput): Promise<GuardrailsGradeResult> {
    const publicItems = input.publicItems ?? [];
    if (isGuardG1Slug(input.slug)) {
      return gradeG1(
        parseString(input.payload, 'attackPrompt'),
        input.hidden,
        publicItems,
        this.gateway,
        input.runId,
      );
    }
    if (isGuardG2Slug(input.slug)) {
      return gradeG2(
        parseString(input.payload, 'pageContent'),
        input.hidden,
        publicItems,
        this.gateway,
        input.runId,
      );
    }
    if (isGuardG3Slug(input.slug)) {
      return gradeG3(parseG3(input.payload), input.hidden, publicItems, input.runId);
    }
    throw new Error(`Unsupported guardrails exercise: ${input.slug}`);
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

function parseG3(payload: unknown): {
  systemPrompt: string;
  inputFilterYaml: string;
  outputFilterYaml: string;
  toolPolicyYaml?: string;
} {
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload must be an object');
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.systemPrompt !== 'string') {
    throw new Error('missing systemPrompt');
  }
  return {
    systemPrompt: record.systemPrompt,
    inputFilterYaml:
      typeof record.inputFilterYaml === 'string' ? record.inputFilterYaml : '',
    outputFilterYaml:
      typeof record.outputFilterYaml === 'string' ? record.outputFilterYaml : '',
    toolPolicyYaml:
      typeof record.toolPolicyYaml === 'string' ? record.toolPolicyYaml : undefined,
  };
}
