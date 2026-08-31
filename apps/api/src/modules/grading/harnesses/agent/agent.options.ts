import {
  A1_SLUG,
  A2_SLUG,
  A3_SLUG,
  A4_SLUG,
  A5_SLUG,
} from '../../../catalogue/exercises/exercises.constants';
import type { AgentGradeOptions } from './a1.grade';

export const AGENT_EXERCISE_SLUGS = [
  A1_SLUG,
  A2_SLUG,
  A3_SLUG,
  A4_SLUG,
  A5_SLUG,
] as const;

export function isAgentExerciseSlug(slug: string): boolean {
  return (AGENT_EXERCISE_SLUGS as readonly string[]).includes(slug);
}

export function agentGradeOptions(slug: string): AgentGradeOptions {
  switch (slug) {
    case A2_SLUG:
      return { requireRecovery: true };
    case A3_SLUG:
      return { requireCalcBeforeStore: true };
    case A4_SLUG:
      return { maxCalls: 3 };
    case A5_SLUG:
      return { maxCalls: 2 };
    default:
      return {};
  }
}
