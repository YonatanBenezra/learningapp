export const SIMULATORS = [
  "rag",
  "evaluation",
  "guardrails",
  "prompt_engineering",
  "agent",
  "benchmark",
  "neural_network",
  "fine_tuning",
] as const;

export type SimulatorSlug = (typeof SIMULATORS)[number];

export const SIMULATOR_LABELS: Record<SimulatorSlug, string> = {
  rag: "RAG",
  evaluation: "Evaluation",
  guardrails: "Guardrails",
  prompt_engineering: "Prompt Engineering",
  agent: "Agent & Tool Use",
  benchmark: "Benchmark Playground",
  neural_network: "Neural Network",
  fine_tuning: "Fine-tuning & Adaptation",
};
