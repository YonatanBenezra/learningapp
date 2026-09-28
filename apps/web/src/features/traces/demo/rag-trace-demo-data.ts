import { DEMO_RUN } from "@/features/workspace/demo/rag-workspace-demo-data";
import type { RunTrace } from "@/types/trace";

export const DEMO_TRACE_RUN_ID = DEMO_RUN.id;

export type RagTracePipelineStep = {
  id: string;
  label: string;
  state: "done" | "skip" | "fail";
};

export const DEMO_RAG_PIPELINE: RagTracePipelineStep[] = [
  { id: "query", label: "Query", state: "done" },
  { id: "planner", label: "Planner", state: "skip" },
  { id: "retriever", label: "Retriever", state: "done" },
  { id: "vsearch", label: "Vector search", state: "done" },
  { id: "evaluator", label: "Evaluator", state: "skip" },
  { id: "context", label: "Context", state: "done" },
  { id: "llm", label: "LLM", state: "skip" },
  { id: "grade", label: "Grade", state: "fail" },
];

export const DEMO_RAG_TRACE: RunTrace = {
  runId: DEMO_TRACE_RUN_ID,
  createdAt: "2026-09-27T08:32:00.000Z",
  simulator: "rag",
  k: 5,
  chunkCount: 61,
  tokensIn: 3744,
  tokensOut: 0,
  costEurMicros: 2300,
  payload: {
    exercise: "rag-001-chunk-it-right",
    chunking: { chunkSize: 1200, overlap: 0, splitStrategy: "fixed" },
    corpus: { docs: 12, avgTokens: 1184 },
    grading: { recallAt5: 0.41, threshold: 0.8, verdict: "fail" },
  },
  queries: [
    {
      queryId: "q_pub_01",
      source: "public sample",
      question: "How long do customers have to request a refund on annual plans?",
      timingLabel: "5 passages • 212 ms",
      retrieved: [
        {
          chunkId: "c07",
          docId: "billing",
          score: 0.82,
          text: "## Billing overview\nPlans renew automatically..\n## Refunds\nAnnual plans can be refunded within 30 days of..",
        },
        {
          chunkId: "c08",
          docId: "billing",
          score: 0.74,
          text: "## Proration\nMid-cycle upgrades bill the difference immediately. Downgrades apply at renewal..",
        },
        {
          chunkId: "c02",
          docId: "faq",
          score: 0.66,
          text: "Q: Can I cancel anytime?\nA: Monthly plans cancel at period end without penalty..",
        },
        {
          chunkId: "c11",
          docId: "terms",
          score: 0.61,
          text: "Acceptance of terms occurs at signup. Enterprise agreements may override standard refund windows..",
        },
        {
          chunkId: "c04",
          docId: "admin",
          score: 0.55,
          text: "Support tiers define response SLAs. Enterprise tenants receive 24/7 escalation..",
        },
      ],
    },
    {
      queryId: "q_pub_02",
      source: "public sample",
      question: "Which regions support EU data residency?",
      timingLabel: "5 passages • best 0.71",
      retrieved: [
        {
          chunkId: "c03",
          docId: "security",
          score: 0.71,
          text: "EU data residency is available in Frankfurt and Dublin regions for enterprise tenants…",
        },
      ],
    },
  ],
};

export const DEMO_RAG_TRACE_META = {
  exerciseSlug: "rag-001-chunk-it-right",
  verdict: "fail" as const,
  recallAt5: 0.41,
  runIdDisplay: "run_7f3a9c2e…b41d",
  configDisplay: "1200 · 0 · fixed",
  createdDisplay: "2026-09-27 14:32:08 +06",
  hiddenQueryCount: 40,
  publicSampleCount: 3,
  pipelineNote: "3 steps skipped in R1",
  statFootnotes: {
    chunks: "12 docs · avg 1,184 tok",
    topK: "fixed for rag-001",
    tokens: "no generation in R1",
    cost: "embeddings + search",
  },
  hiddenFooter:
    "40 hidden-set queries ran in this trace. Their questions, passages and gold labels stay private.",
};
