export const SIMULATORS = [
  'rag',
  'evaluation',
  'guardrails',
  'prompt_engineering',
  'agent',
  'benchmark',
  'neural_network',
  'fine_tuning',
] as const;

export type SimulatorSlug = (typeof SIMULATORS)[number];
