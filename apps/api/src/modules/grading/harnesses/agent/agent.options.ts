import {
  A1_SLUG,
  A2_SLUG,
  A3_SLUG,
  A4_SLUG,
  A5_SLUG,
  exerciseNumber,
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
  const n = exerciseNumber(slug, 'agt');
  return n !== null && n >= 1 && n <= 25;
}

const AGENT_OPTION_TEMPLATES: Record<
  string,
  import('./a1.grade').AgentGradeOptions
> = {
  [A1_SLUG]: {},
  [A2_SLUG]: { requireRecovery: true },
  [A3_SLUG]: { requireCalcBeforeStore: true },
  [A4_SLUG]: { maxCalls: 3 },
  [A5_SLUG]: { maxCalls: 2 },
};

const AGENT_TEMPLATE_BY_NUM = [
  A1_SLUG,
  A2_SLUG,
  A3_SLUG,
  A4_SLUG,
  A5_SLUG,
] as const;

export function agentGradeOptions(slug: string): import('./a1.grade').AgentGradeOptions {
  if (slug in AGENT_OPTION_TEMPLATES) {
    return AGENT_OPTION_TEMPLATES[slug];
  }
  const n = exerciseNumber(slug, 'agt');
  if (n === null) {
    return {};
  }
  const template = AGENT_TEMPLATE_BY_NUM[(n - 1) % AGENT_TEMPLATE_BY_NUM.length];
  return AGENT_OPTION_TEMPLATES[template] ?? {};
}
