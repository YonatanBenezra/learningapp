import type { RagLabArchetype } from "./rag-lab-types";

export type LabTab = "corpus" | "chunks" | "query" | "generate" | "target";

export const LAB_TAB_LABELS: Record<LabTab, string> = {
  corpus: "Corpus",
  chunks: "Chunks",
  query: "Query",
  generate: "Generate",
  target: "Target bot",
};

export function labTabsForArchetype(archetype: RagLabArchetype): LabTab[] {
  if (archetype === "redteam") {
    return ["target", "corpus"];
  }
  if (archetype === "r3") {
    return ["corpus", "chunks", "query", "generate"];
  }
  return ["corpus", "chunks", "query"];
}

export const CHUNK_ID_TIP =
  "Document id and chunk index — e.g. pto:0 is the first chunk of the Paid time off doc.";

export const SCORE_TIP =
  "BM25 keyword relevance: rare matching words count more and long chunks are normalised. Not AI confidence.";

export const SPLIT_STRATEGY_TIPS: Record<string, string> = {
  fixed: "Cut at fixed character lengths. Fast, but can split mid-sentence.",
  sentence: "Pack whole sentences until the chunk size is reached.",
  recursive: "Same as sentence packing — merges sentences up to your chunk size.",
  "heading-aware":
    "Treat each document as one chunk. Easy recall, but whole documents use the most context.",
};

export const METRIC_TIPS: Record<string, string> = {
  recall_at_5:
    "Share of questions where the answer text appears in the top 5 retrieved chunks.",
  recall_at_k:
    "Share of questions where the answer appears in your top-k retrieved chunks.",
  mean_context_tokens:
    "Average tokens of the top 5 chunks, i.e. the context a model would read.",
  mean_prompt_tokens:
    "Average prompt tokens per question. Every retrieved chunk is sent in full.",
  recall_faq: "Share of FAQ questions whose answer line reached the context.",
  recall_policy: "Share of policy questions whose answer sentence reached the context.",
  recall_procedural: "Share of procedural questions whose whole procedure sat in one retrieved chunk.",
  flag_captured: "1 when the submitted flag matches exactly.",
};

export function metricLabel(key: string): string {
  const labels: Record<string, string> = {
    recall_at_5: "Recall @ 5",
    recall_at_k: "Recall @ k",
  };
  return labels[key] ?? key.replace(/_/g, " ");
}
