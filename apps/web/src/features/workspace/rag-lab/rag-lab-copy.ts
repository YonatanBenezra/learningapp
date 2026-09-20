import type { RagLabArchetype } from "./rag-lab-types";

export type LabTab = "corpus" | "chunks" | "query" | "generate";

export const LAB_TAB_LABELS: Record<LabTab, string> = {
  corpus: "Corpus",
  chunks: "Chunks",
  query: "Query",
  generate: "Generate",
};

export function labTabsForArchetype(archetype: RagLabArchetype): LabTab[] {
  if (archetype === "r3") {
    return ["corpus", "chunks", "query", "generate"];
  }
  return ["corpus", "chunks", "query"];
}

export const CHUNK_ID_TIP =
  "Document id and chunk index — e.g. pto:0 is the first chunk of the Paid time off doc.";

export const SCORE_TIP =
  "Keyword overlap with the query. Higher means more matching words, not AI confidence.";

export const SPLIT_STRATEGY_TIPS: Record<string, string> = {
  fixed: "Cut at fixed character lengths. Fast, but can split mid-sentence.",
  sentence: "Pack whole sentences until the chunk size is reached.",
  recursive: "Same as sentence packing — merges sentences up to your chunk size.",
  "heading-aware":
    "Treat each document as one chunk. Good baseline when docs are short policies.",
};

export const METRIC_TIPS: Record<string, string> = {
  recall_at_5:
    "Share of questions where the answer text appears in the top 5 retrieved chunks.",
  recall_at_k:
    "Share of questions where the answer appears in your top-k retrieved chunks.",
};

export function metricLabel(key: string): string {
  const labels: Record<string, string> = {
    recall_at_5: "Recall @ 5",
    recall_at_k: "Recall @ k",
  };
  return labels[key] ?? key.replace(/_/g, " ");
}
