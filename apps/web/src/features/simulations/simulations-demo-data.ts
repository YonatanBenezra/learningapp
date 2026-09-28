import { routes } from "@/config/routes";
import { SIMULATOR_DESCRIPTIONS, SIMULATOR_LABELS } from "@/config/simulators";

export const RAG_DEMO_SLUG = "rag-001-chunk-it-right";

export const simulationsPageCopy = {
  title: "Simulators",
  simulatorCountLabel: "1 simulator",
  lead:
    "Build and debug retrieval pipelines. Every submission is graded against a hidden test set, and every run comes with a full trace.",
  promoKicker: "RAG simulator",
  promoTitle: "Practice retrieval. Prove it on data you can't see.",
  promoCopy: "Tune chunking, top-k and reranking. Get a scorecard, not a certificate.",
  promoRun: {
    runId: "run_7f3a…b41d",
    exercise: "rag-001",
    recall: { value: "0.86", threshold: "≥ 0.80", pass: true },
    cost: "€0.0021",
  },
  footnote: "More exercises ship after simulator v1.",
} as const;

export const ragSimulatorCard = {
  kicker: "Simulator",
  title: SIMULATOR_LABELS.rag,
  description: SIMULATOR_DESCRIPTIONS.rag,
  tags: ["chunking", "top-k", "rerank", "grounding", "citations"] as const,
  pipeline: ["Corpus", "Chunk", "Retrieve", "Grade"] as const,
  activePipelineStep: 1,
  stats: [
    { value: "3", label: "exercises in v1" },
    { value: "40", label: "hidden queries each" },
    { value: "100%", label: "runs traced" },
  ] as const,
  gradedOn: ["recall@k", "citations", "tokens", "cost"] as const,
  problemsHref: `${routes.problems}?track=rag`,
  demoWorkspaceHref: routes.demoRagWorkspace,
} as const;

export const ragGuidedPath = {
  title: "Guided path",
  name: "RAG fundamentals",
  steps: [
    { id: "R1", label: "Chunk It Right", active: true, href: routes.demoRagWorkspace },
    { id: "R2", label: "Top-k & Rerank", active: false },
    { id: "R3", label: "Python retriever", active: false },
  ] as const,
  ctaHref: routes.demoRagWorkspace,
  ctaLabel: "Start with R1",
} as const;
