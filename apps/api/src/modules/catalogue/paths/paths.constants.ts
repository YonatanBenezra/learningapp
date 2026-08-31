import { G1_SLUG, G2_SLUG, G3_SLUG, R1_SLUG, R2_SLUG } from '../exercises/exercises.constants';

export const RAG_FUNDAMENTALS_PATH = 'rag-fundamentals';
export const GUARDRAILS_RED_TEAM_PATH = 'guardrails-red-team';

export const RAG_FUNDAMENTALS_STEPS = [
  R1_SLUG,
  R2_SLUG,
  'rag-005-sentence-split',
] as const;

export const GUARDRAILS_RED_TEAM_STEPS = [G1_SLUG, G2_SLUG, G3_SLUG] as const;
