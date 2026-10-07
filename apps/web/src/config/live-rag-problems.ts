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
    summary: "Heading-aware overlap so gold spans are not split across chunks.",
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
    summary: "Hit recall@5 ≥ 0.80 on ticket-style policy questions.",
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
    nextCta: "Stale index refresh",
  },
  {
    id: "P3-R2",
    slug: "rag-018-retriever-run",
    title: "Stale Index & Retriever Refresh",
    summary: "Re-tune retrieval after corpus re-index so hidden eval tracks fresh docs.",
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
    summary: "Lift nDCG@5 with reranker, MMR, and query rewrite under token caps.",
    href: routes.exercise("rag-004-rerank-or-rethink"),
    nextCta: "Hybrid rank boost",
  },
  {
    id: "P4-R2",
    slug: "rag-021-rank-boost",
    title: "Hybrid Search & Rank Boost",
    summary: "Lexical + dense fusion via rerank and rewrite for SKU-heavy queries.",
    href: routes.exercise("rag-021-rank-boost"),
    nextCta: "Query routing mix",
  },
  {
    id: "P4-R3",
    slug: "rag-017-rerank-pass",
    title: "Query Routing & Retrieval Mix",
    summary: "Tune top-k, rerank, and chunk profile for mixed query classes.",
    href: routes.exercise("rag-017-rerank-pass"),
    nextCta: "Context packing",
  },
  {
    id: "P5-R1",
    slug: "rag-016-citation-lock",
    title: "Context Packing Under Token Budget",
    summary: "Maximize signal in the context window under token caps.",
    href: routes.exercise("rag-016-citation-lock"),
    nextCta: "Custom retriever",
  },
  {
    id: "P5-R2",
    slug: "rag-009-python-retriever",
    title: "Custom Retriever (Code Sandbox)",
    summary: "Ship Python retrieval code that passes hidden recall@5.",
    href: routes.exercise("rag-009-python-retriever"),
    nextCta: "Multi-hop queries",
  },
  {
    id: "P6-R1",
    slug: "rag-024-query-fit",
    title: "Multi-Hop Query Decomposition",
    summary: "Sandbox retriever that bridges two-hop policy questions.",
    href: routes.exercise("rag-024-query-fit"),
    nextCta: "Adversarial corpus",
  },
  {
    id: "P6-R2",
    slug: "rag-023-span-match",
    title: "Adversarial Corpus & Span Evasion",
    summary: "Ignore poison chunks and lock onto gold citation spans.",
    href: routes.exercise("rag-023-span-match"),
    nextCta: "Spend abuse",
  },
  {
    id: "P6-R3",
    slug: "rag-008-spend-cap",
    title: "Rate & Spend Abuse Under Load",
    summary: "Keep recall within SLO when tenants hammer retrieval.",
    href: routes.exercise("rag-008-spend-cap"),
    nextCta: "Eval regression gate",
  },
  {
    id: "P6-R4",
    slug: "rag-022-score-gate",
    title: "Eval Slice Regression Gate",
    summary: "Fix rerank so the SKU slice passes without global regression.",
    href: routes.exercise("rag-022-score-gate"),
  },
];

export const LIVE_RAG_SLUGS = LIVE_RAG_PROBLEMS.map((p) => p.slug);

export const LIVE_RAG_FALLBACK_HREF = routes.problems;
