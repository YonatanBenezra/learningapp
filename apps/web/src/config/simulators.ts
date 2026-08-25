export const SIMULATORS = [
  "rag",
  "evaluation",
  "guardrails",
] as const;

export type SimulatorSlug = (typeof SIMULATORS)[number];
