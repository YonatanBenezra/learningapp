import { routes } from "@/config/routes";

/** Mirrors `apps/api/content/published-slugs.json` — keep in sync when publishing. */
export const LIVE_RAG_PROBLEMS = [
  {
    id: "R1",
    slug: "rag-001-chunk-it-right",
    title: "Chunk It Right",
    summary: "Fix chunk size, overlap, and split strategy for recall@5 on a hidden set.",
    href: routes.exercise("rag-001-chunk-it-right"),
  },
  {
    id: "R1b",
    slug: "rag-006-overlap-tune",
    title: "Overlap Tune",
    summary: "Heading-aware chunks with overlap — tune boundaries so gold spans land in top-k.",
    href: routes.exercise("rag-006-overlap-tune"),
  },
] as const;

export const LIVE_RAG_SLUGS = LIVE_RAG_PROBLEMS.map((p) => p.slug);
