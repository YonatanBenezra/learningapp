import { routes } from "@/config/routes";
import { LIVE_RAG_PROBLEMS } from "@/config/live-rag-problems";
import { SIMULATOR_DESCRIPTIONS, SIMULATOR_LABELS } from "@/config/simulators";

export const RAG_DEMO_SLUG = LIVE_RAG_PROBLEMS[0].slug;

export const simulationsPageCopy = {
  title: "Simulators",
  simulatorCountLabel: "1 simulator · 2 live problems",
  lead:
    "Build and debug retrieval pipelines. Submit on live problems — every run is graded on a hidden set with a full trace.",
  promoKicker: "RAG simulator",
  promoTitle: "Practice retrieval. Prove it on data you can't see.",
  promoCopy:
    "Tune chunking on two published exercises. Scorecard + trace on every submit — same flow as production RAG debugging.",
  promoRun: {
    runId: "run_7f3a…b41d",
    exercise: "rag-001",
    recall: { value: "0.86", threshold: "≥ 0.80", pass: true },
    cost: "€0.0021",
  },
  footnote: "UI preview: demo workspace/trace routes stay available; grading uses live exercises.",
} as const;

export const ragSimulatorCard = {
  kicker: "Simulator",
  title: SIMULATOR_LABELS.rag,
  description: SIMULATOR_DESCRIPTIONS.rag,
  tags: ["chunking", "overlap", "recall@5", "trace", "hidden eval"] as const,
  pipeline: ["Corpus", "Chunk", "Retrieve", "Grade"] as const,
  activePipelineStep: 1,
  stats: [
    { value: String(LIVE_RAG_PROBLEMS.length), label: "live problems" },
    { value: "40", label: "hidden queries each" },
    { value: "100%", label: "runs traced" },
  ] as const,
  gradedOn: ["recall@k", "failure class", "tokens", "cost"] as const,
  problemsHref: `${routes.problems}?track=rag`,
  demoWorkspaceHref: routes.demoRagWorkspace,
  demoTraceHref: routes.demoRagTrace,
} as const;

export const ragGuidedPath = {
  title: "Live problems",
  name: "RAG chunking track",
  steps: LIVE_RAG_PROBLEMS.map((problem, index) => ({
    id: problem.id,
    label: problem.title,
    active: index === 0,
    href: problem.href,
  })),
  ctaHref: LIVE_RAG_PROBLEMS[0].href,
  ctaLabel: "Start with Chunk It Right",
} as const;
