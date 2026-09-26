import { routes } from "./routes";

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

export const SIMULATOR_DESCRIPTIONS: Record<SimulatorSlug, string> = {
  rag: "Chunking, retrieval, reranking, grounding, and citation discipline.",
  evaluation: "Assertions, judges, slice specs, and regression detection.",
  guardrails: "Prompt injection, tool abuse, and defense stacks.",
  prompt_engineering: "Prompt contracts, structured outputs, and iteration.",
  agent: "Tool policies, multi-step plans, and sandbox execution.",
  benchmark: "Compare models and configs on fixed task suites.",
  neural_network: "Architecture choices, regularization, and training diagnostics.",
  fine_tuning: "LoRA, adapters, and adaptation tradeoffs.",
};

export function problemsForSimulator(slug: SimulatorSlug): string {
  return `${routes.problems}?track=${encodeURIComponent(slug)}`;
}
