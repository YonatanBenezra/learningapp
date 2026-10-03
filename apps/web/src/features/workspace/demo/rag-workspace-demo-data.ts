import type { Exercise } from "@/types/exercise";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import { LIVE_RAG_PROBLEMS } from "@/config/live-rag-problems";

const RAG_DEMO_SLUG = LIVE_RAG_PROBLEMS[0].slug;

export const DEMO_STARTER = {
  chunkSize: 400,
  overlap: 80,
  splitStrategy: "heading-aware",
} as const;

export const DEMO_SUBMISSION_SCHEMA = {
  type: "object",
  required: ["chunkSize", "overlap", "splitStrategy"],
  properties: {
    chunkSize: { type: "integer", minimum: 100, maximum: 2000, default: 400 },
    overlap: { type: "integer", minimum: 0, maximum: 800, default: 80 },
    splitStrategy: {
      type: "string",
      enum: ["sentence", "paragraph", "heading-aware"],
      default: "heading-aware",
    },
  },
} as const;

export const DEMO_EXERCISE: Exercise = {
  slug: RAG_DEMO_SLUG,
  version: 1,
  title: "Chunk It Right",
  simulator: "rag",
  difficulty: "E",
  skillTags: ["chunking", "retrieval-quality"],
  briefMd: `## Goal

Fix how documents are chunked so the retriever finds the right passages. **Only chunking fields are editable** for this exercise.

## Pass criteria

Hidden-set **recall@5 ≥ 0.80** (40 queries).

## Corpus

Internal support docs — billing, security, and admin policies.`,
  submissionSchema: DEMO_SUBMISSION_SCHEMA,
  publicSample: [
    { id: "p1", question: "How long do customers have to request a refund?" },
    { id: "p2", question: "Who can reset MFA for enterprise tenants?" },
    { id: "p3", question: "What is the data retention window for audit logs?" },
  ],
};

export const DEMO_RUN: Run = {
  id: "demo-run-7f3a",
  status: "succeeded",
  exerciseSlug: RAG_DEMO_SLUG,
  title: "Chunk It Right",
};

export const DEMO_FIGMA = {
  submissionCount: 2,
  meta: { id: "rag-001", duration: "~15 min", solved: "214 solved" },
  goal:
    "Fix how documents are chunked so the retriever finds the right passages. Only chunking fields are editable for this exercise.",
  constraint: {
    metric: "recall@5",
    threshold: "≥ 0.80",
    footnote: "on the hidden set · 40 queries",
    fields: "chunkSize · overlap · splitStrategy",
  },
  publicSampleNote: "Public sample — not used for grading",
  publicRows: [
    {
      question: "How long do customers have to r…",
      file: "billing.md",
      tag: "billing",
    },
    {
      question: "Who can reset MFA for enterpris…",
      file: "security.md",
      tag: "security",
    },
    {
      question: "What is the data retention wind…",
      file: "admin.md",
      tag: "admin",
    },
  ],
  hints: [
    {
      n: 1,
      unlocked: true,
      text: "Heading-aware splits keep policy sections intact — try chunk sizes that fit 2–3 H2 blocks.",
    },
    {
      n: 2,
      unlocked: false,
      unlockAfter: 2,
    },
  ],
} as const;

export const DEMO_GRADE_PASS: Grade = {
  verdict: "pass",
  metrics: {
    "recall@5": { value: 0.86, hits: 34, total: 40 },
    meanTokens: { value: 288 },
  },
  scorecard: {
    headline: "Accepted",
    threshold: 0.8,
    elapsedSeconds: 2.1,
  },
  failingCases: [],
};

export const DEMO_GRADE_FAIL: Grade = {
  verdict: "fail",
  metrics: {
    "recall@5": { value: 0.41, hits: 17, total: 40 },
    meanTokens: { value: 312 },
  },
  failureClasses: ["retrieval:chunk-too-large"],
  scorecard: {
    message: "Below threshold",
    headline: "Below threshold",
    threshold: 0.8,
    elapsedSeconds: 2.4,
    failingCount: 3,
    totalCases: 24,
    caseIds: ["q_h_07", "q_h_12", "q_h_19"],
    failureDetail:
      "Chunks average 1,184 tokens and cross headings, so the relevant sentence is diluted and ranks below 5.",
  },
  failingCases: [
    {
      question: "How long is the refund window for annual plans?",
      note: "Retrieved chunks missed gold span.",
    },
    {
      question: "Which role may export customer PII?",
      note: "Retrieved chunks missed gold span.",
    },
    {
      question: "When does log retention extend to 365 days?",
      note: "Retrieved chunks missed gold span.",
    },
  ],
};
