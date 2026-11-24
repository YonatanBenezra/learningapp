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
    summary:
      "Normalize docs and fix chunk boundaries until recall@5 meets the launch gate.",
    href: routes.exercise("rag-001-chunk-it-right"),
    nextCta: "Answers on the border",
  },
  {
    id: "P1-R2",
    slug: "rag-006-overlap-tune",
    title: "Answers on the Border",
    summary:
      "Two-sentence answers get cut at chunk boundaries; use overlap so every pair stays together.",
    href: routes.exercise("rag-006-overlap-tune"),
    nextCta: "Retrieval top-k baseline",
  },
  {
    id: "P1-R3",
    slug: "rag-003-retrieval-top-k",
    title: "Retrieval Top-K Baseline",
    summary:
      "Set top-k and rerank on a frozen index — recall@k under token budget.",
    href: routes.exercise("rag-003-retrieval-top-k"),
    nextCta: "Keep the heading with the row",
  },
  {
    id: "P2-R1",
    slug: "rag-010-window-fit",
    title: "Keep the Heading with the Row",
    summary:
      "Markdown tables reuse the same model names; split so each row keeps its page and section heading.",
    href: routes.exercise("rag-010-window-fit"),
    nextCta: "Recall@k SLA",
  },
  {
    id: "P2-R2",
    slug: "rag-007-chunk-balance",
    title: "Recall@k SLA on Policy KB",
    summary:
      "Hit recall@5 ≥ 0.80 on policy questions inside a 165-token context budget.",
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
    nextCta: "Hybrid search",
  },
  {
    id: "P3-R2",
    slug: "rag-018-retriever-run",
    title: "Hybrid Search for the Support Desk",
    summary:
      "Answer exact model-number lookups and reworded questions alike: BM25, dense, or a hybrid of both.",
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
    summary:
      "Lift nDCG@5 over a keyword-count first stage by choosing a reranker and window.",
    href: routes.exercise("rag-004-rerank-or-rethink"),
    nextCta: "A reranker that reads",
  },
  {
    id: "P4-R2",
    slug: "rag-021-rank-boost",
    title: "A Reranker That Reads",
    summary:
      "Marketing pages with bait titles bury the real answer; pick the reranker and window that lift it.",
    href: routes.exercise("rag-021-rank-boost"),
    nextCta: "Rerank to full recall",
  },
  {
    id: "P4-R3",
    slug: "rag-017-rerank-pass",
    title: "Rerank to Full Recall on a Tight Budget",
    summary:
      "Every question must find its answer with about one chunk of prompt.",
    href: routes.exercise("rag-017-rerank-pass"),
    nextCta: "Context packing",
  },
  {
    id: "P5-R1",
    slug: "rag-016-citation-lock",
    title: "Context Packing Under Token Budget",
    summary: "Keep recall@k ≥ 0.95 with prompts under 90 tokens.",
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
    nextCta: "Current policies only",
  },
  {
    id: "P6-R3",
    slug: "rag-008-spend-cap",
    title: "Current Policies Only",
    summary:
      "Keep superseded and draft policy versions out of the context with a metadata filter.",
    href: routes.exercise("rag-008-spend-cap"),
    nextCta: "Pack the context",
  },
  {
    id: "P6-R4",
    slug: "rag-022-score-gate",
    title: "Pack the Context",
    summary:
      "Near-identical wiki copies fill the token budget; drop duplicates so the answer fits.",
    href: routes.exercise("rag-022-score-gate"),
    nextCta: "Query routing",
  },
  {
    id: "P4-R5",
    slug: "rag-031-query-routing",
    title: "Build the Router",
    summary:
      "Nobody labels the questions any more: route each one to the FAQ, policy or procedural profile yourself.",
    href: routes.exercise("rag-031-query-routing"),
    nextCta: "Two offices, two languages",
  },
  {
    id: "P4-R6",
    slug: "rag-032-two-languages",
    title: "Two Offices, Two Languages",
    summary:
      "Bangla questions about English pages and the reverse: pick a retriever that crosses languages.",
    href: routes.exercise("rag-032-two-languages"),
    nextCta: "Advanced: cost-capped retrieval",
  },
  {
    id: "ADV-1",
    slug: "rag-025-adv-cost-ceiling",
    title: "Cost-Capped Retrieval (Advanced)",
    summary:
      "Hold recall@k ≥ 0.95 while the whole prompt fits in about 60 tokens.",
    href: routes.exercise("rag-025-adv-cost-ceiling"),
    nextCta: "Advanced: recall@k SLA",
  },
  {
    id: "ADV-2",
    slug: "rag-026-adv-chunk-balance",
    title: "Recall@k SLA on Policy KB (Advanced)",
    summary: "Clear recall@5 ≥ 0.90 with top-5 context under 130 tokens.",
    href: routes.exercise("rag-026-adv-chunk-balance"),
    nextCta: "Advanced: refuse before you spend",
  },
  {
    id: "ADV-3",
    slug: "rag-027-adv-citation-contract",
    title: "Refuse Before You Spend (Advanced)",
    summary:
      "Cited answers from a real model, and a score threshold that refuses hopeless questions without a model call.",
    href: routes.exercise("rag-027-adv-citation-contract"),
    nextCta: "Advanced: speak the handbook's language",
  },
  {
    id: "ADV-4",
    slug: "rag-028-adv-rerank-rethink",
    title: "Speak the Handbook's Language (Advanced)",
    summary:
      "Staff ask with abbreviations and typos; write a query rewrite that finds the formal policy.",
    href: routes.exercise("rag-028-adv-rerank-rethink"),
    nextCta: "Advanced: custom retriever",
  },
  {
    id: "ADV-5",
    slug: "rag-029-adv-python-retriever",
    title: "Custom Retriever — Advanced Sandbox",
    summary:
      "Python retriever that lands almost every hidden answer in its top 5.",
    href: routes.exercise("rag-029-adv-python-retriever"),
    nextCta: "Advanced: two hops to the answer",
  },
  {
    id: "ADV-6",
    slug: "rag-030-adv-score-gate",
    title: "Two Hops to the Answer (Advanced)",
    summary:
      "Answers that need a chain of pages: search again with what the first search found.",
    href: routes.exercise("rag-030-adv-score-gate"),
    nextCta: "Red team: prompt leak",
  },
  {
    id: "RT-1",
    slug: "rag-101-rt-prompt-leak",
    title: "Red Team 1: Prompt Leak",
    summary:
      "Get the support bot to reveal its system prompt and capture the flag.",
    href: routes.exercise("rag-101-rt-prompt-leak"),
    nextCta: "Red team: poisoned document",
  },
  {
    id: "RT-2",
    slug: "rag-102-rt-poisoned-doc",
    title: "Red Team 2: Poisoned Document",
    summary:
      "Trigger an instruction hidden in a knowledge-base note to leak a privileged runbook.",
    href: routes.exercise("rag-102-rt-poisoned-doc"),
    nextCta: "Red team: tenant leak",
  },
  {
    id: "RT-3",
    slug: "rag-103-rt-tenant-leak",
    title: "Red Team 3: Tenant Leak",
    summary:
      "Abuse a cross-tenant search fallback to read another workspace's notes.",
    href: routes.exercise("rag-103-rt-tenant-leak"),
  },
];

export const LIVE_RAG_SLUGS = LIVE_RAG_PROBLEMS.map((p) => p.slug);

export const LIVE_RAG_FALLBACK_HREF = routes.problems;
