import { routes } from "./routes";

/** UI tracks (catalogue may still be empty until publish). */
export const SIMULATORS = ["rag"] as const;

export type SimulatorSlug = (typeof SIMULATORS)[number];

export const SIMULATOR_LABELS: Record<SimulatorSlug, string> = {
  rag: "RAG",
};

export const SIMULATOR_DESCRIPTIONS: Record<SimulatorSlug, string> = {
  rag: "Chunking, retrieval, reranking, grounding, and citation discipline.",
};

export function problemsForSimulator(slug: SimulatorSlug): string {
  return `${routes.problems}?track=${encodeURIComponent(slug)}`;
}

export function isActiveSimulator(value: string): value is SimulatorSlug {
  return (SIMULATORS as readonly string[]).includes(value);
}

export function simulatorLabel(simulator: string): string {
  if (isActiveSimulator(simulator)) {
    return SIMULATOR_LABELS[simulator];
  }
  return simulator;
}
