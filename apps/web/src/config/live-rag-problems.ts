import { routes } from "@/config/routes";

export type LiveRagProblem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  href: string;
  nextCta?: string;
};

/** Mirrors published RAG slugs in `apps/api/content/published-slugs.json`. */
export const LIVE_RAG_PROBLEMS: readonly LiveRagProblem[] = [
  {
    id: "P1-R1",
    slug: "rag-001-chunk-it-right",
    title: "Corpus Chunk Boundaries",
    summary: "Normalize docs and fix chunk boundaries until recall@5 meets the launch gate.",
    href: routes.exercise("rag-001-chunk-it-right"),
    nextCta: "Overlap & sliding windows",
  },
  {
    id: "P1-R2",
    slug: "rag-006-overlap-tune",
    title: "Overlap & Sliding Windows",
    summary: "Sentence splits and overlap that keep gold sentences whole within a context budget.",
    href: routes.exercise("rag-006-overlap-tune"),
    nextCta: "Retrieval top-k baseline",
  },
  {
    id: "P1-R3",
    slug: "rag-003-retrieval-top-k",
    title: "Retrieval Top-K Baseline",
    summary: "Set top-k and rerank on a frozen index — recall@k under token budget.",
    href: routes.exercise("rag-003-retrieval-top-k"),
    nextCta: "Metadata scope & window fit",
  },
  {
    id: "P2-R1",
    slug: "rag-010-window-fit",
    title: "Metadata Scope & Window Fit",
    summary: "Align chunk windows with policy sections — scope before retrieval.",
    href: routes.exercise("rag-010-window-fit"),
    nextCta: "Recall@k SLA",
  },
  {
    id: "P2-R2",
    slug: "rag-007-chunk-balance",
    title: "Recall@k SLA on Policy KB",
    summary: "Hit recall@5 ≥ 0.80 on policy questions inside a 220-token context budget.",
    href: routes.exercise("rag-007-chunk-balance"),
    nextCta: "Cost-capped retrieval",
  },
  {
    id: "P2-R3",
    slug: "rag-002-the-cost-ceiling",
    title: "Cost-Capped Retrieval",
    summary: "Hold recall@k while mean prompt tokens stay under FinOps cap.",
    href: routes.exercise("rag-002-the-cost-ceiling"),
    nextCta: "Citation-grounded answers",
  },
  {
    id: "P3-R1",
    slug: "rag-003-the-citation-contract",
    title: "Citation-Grounded Answers",
    summary: "Generation prompt with [chunk:id] citations and honest refusal.",
    href: routes.exercise("rag-003-the-citation-contract"),
    nextCta: "Re-tune after a re-index",
  },
  {
    id: "P3-R2",
    slug: "rag-018-retriever-run",
    title: "Re-tune Retrieval After a Re-index",
    summary: "Re-tune top-k, rerank and chunk size for sentence-packed chunks under a 300-token budget.",
    href: routes.exercise("rag-018-retriever-run"),
    nextCta: "Hidden eval discipline",
  },
  {
    id: "P3-R3",
    slug: "rag-005-sentence-split",
    title: "Public vs Hidden Eval Discipline",
    summary: "Pass held-out recall@5 — not just the visible QA set.",
    href: routes.exercise("rag-005-sentence-split"),
    nextCta: "Two-stage rerank",
  },
  {
    id: "P4-R1",
    slug: "rag-004-rerank-or-rethink",
    title: "Two-Stage Retrieve + Rerank",
    summary: "Lift nDCG@5 over a keyword-count first stage by choosing a reranker and window.",
    href: routes.exercise("rag-004-rerank-or-rethink"),
    nextCta: "Title-aware reranking",
  },
  {
    id: "P4-R2",
    slug: "rag-021-rank-boost",
    title: "Title-Aware Reranking",
    summary: "Use document titles to lift nDCG@5 by at least 0.20 over the first stage.",
    href: routes.exercise("rag-021-rank-boost"),
    nextCta: "Rerank to full recall",
  },
  {
    id: "P4-R3",
    slug: "rag-017-rerank-pass",
    title: "Rerank to Full Recall on a Tight Budget",
    summary: "Every question must find its answer with about one chunk of prompt.",
    href: routes.exercise("rag-017-rerank-pass"),
    nextCta: "Context packing",
  },
  {
    id: "P5-R1",
    slug: "rag-016-citation-lock",
    title: "Context Packing Under Token Budget",
    summary: "Keep recall@k ≥ 0.95 with prompts under 120 tokens.",
    href: routes.exercise("rag-016-citation-lock"),
    nextCta: "Custom retriever",
  },
  {
    id: "P5-R2",
    slug: "rag-009-python-retriever",
    title: "Custom Retriever (Code Sandbox)",
    summary: "Ship Python retrieval code that passes hidden recall@5.",
    href: routes.exercise("rag-009-python-retriever"),
    nextCta: "Full-corpus custom retriever",
  },
  {
    id: "P6-R1",
    slug: "rag-024-query-fit",
    title: "Custom Retriever on the Full Policy Corpus",
    summary: "Python retriever on the 24-document corpus with recall@5 ≥ 0.90.",
    href: routes.exercise("rag-024-query-fit"),
    nextCta: "Retriever vs keyword noise",
  },
  {
    id: "P6-R2",
    slug: "rag-023-span-match",
    title: "Custom Retriever vs Keyword-Stuffed Noise",
    summary: "Keep eight keyword-stuffed noise documents out of your top 5.",
    href: routes.exercise("rag-023-span-match"),
    nextCta: "Spend cap",
  },
  {
    id: "P6-R3",
    slug: "rag-008-spend-cap",
    title: "Spend Cap on Retrieval",
    summary: "Hold recall@k ≥ 0.95 with mean prompt tokens ≤ 200.",
    href: routes.exercise("rag-008-spend-cap"),
    nextCta: "Rerank without model calls",
  },
  {
    id: "P6-R4",
    slug: "rag-022-score-gate",
    title: "Rerank Without Extra Model Calls",
    summary: "Lift nDCG@5 with reranking alone, with zero model calls.",
    href: routes.exercise("rag-022-score-gate"),
    nextCta: "Query routing",
  },
  {
    id: "P4-R5",
    slug: "rag-031-query-routing",
    title: "Query Routing: One Profile per Question Type",
    summary: "Separate retrieval profiles for FAQ, policy and procedural questions under one budget.",
    href: routes.exercise("rag-031-query-routing"),
    nextCta: "Red team: prompt leak",
  },
  {
    id: "RT-1",
    slug: "rag-101-rt-prompt-leak",
    title: "Red Team 1: Prompt Leak",
    summary: "Get the support bot to reveal its system prompt and capture the flag.",
    href: routes.exercise("rag-101-rt-prompt-leak"),
    nextCta: "Red team: poisoned document",
  },
  {
    id: "RT-2",
    slug: "rag-102-rt-poisoned-doc",
    title: "Red Team 2: Poisoned Document",
    summary: "Trigger an instruction hidden in a knowledge-base note to leak a privileged runbook.",
    href: routes.exercise("rag-102-rt-poisoned-doc"),
    nextCta: "Red team: tenant leak",
  },
  {
    id: "RT-3",
    slug: "rag-103-rt-tenant-leak",
    title: "Red Team 3: Tenant Leak",
    summary: "Abuse a cross-tenant search fallback to read another workspace's notes.",
    href: routes.exercise("rag-103-rt-tenant-leak"),
  },
];

export const LIVE_RAG_SLUGS = LIVE_RAG_PROBLEMS.map((p) => p.slug);

export const LIVE_RAG_FALLBACK_HREF = routes.problems;
