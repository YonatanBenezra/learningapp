import type { RagLabArchetype } from "./rag-lab-types";

export type LabTab = "corpus" | "chunks" | "query" | "probe" | "generate" | "target";

export const LAB_TAB_LABELS: Record<LabTab, string> = {
  corpus: "Corpus",
  chunks: "Chunks",
  query: "Query",
  probe: "Probe",
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
  return ["corpus", "chunks", "query", "probe"];
}

export const CHUNK_ID_TIP =
  "Document id and chunk index — e.g. pto:0 is the first chunk of the Paid time off doc.";

export const SCORE_TIP =
  "Ranking score from the first stage (or the reranker, when one ran). BM25: keyword relevance, rare words count more. Dense: embedding similarity. Hybrid: both, rescaled to 0–1. Not AI confidence.";

export const SPLIT_STRATEGY_TIPS: Record<string, string> = {
  fixed: "Word windows up to the chunk size. Never cuts a word, but can cut a sentence in two.",
  sentence:
    "Packs whole sentences up to the chunk size. Never cuts a sentence, so one long sentence can exceed the size.",
  recursive:
    "Splits by paragraph, then line, then sentence, then word, only where a piece is still too big. The size is a hard limit.",
  "heading-aware":
    "One section per markdown heading, split inside the section, and every chunk starts with its document title and heading. Costs a few tokens per chunk.",
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
