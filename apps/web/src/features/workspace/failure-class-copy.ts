/**
 * Plain-language copy for grader failure classes and miss causes. Graders
 * derive these from evidence (rankings, budgets, model output); the copy says
 * what happened, not which knob to turn.
 */
const COPY: Record<string, string> = {
  "context-over-budget":
    "Context over budget: the chunks sent per question cost more tokens than allowed.",
  "gold-split-by-chunking":
    "No single chunk holds the whole answer: your chunk boundaries cut it.",
  "gold-ranked-below-k":
    "The answer chunk exists, but retrieval ranked it below your top-k.",
  "gold-outside-rerank-pool":
    "The reranker never saw the answer chunk: it was outside the candidate pool.",
  "rerank-demoted-gold":
    "Retrieval had the answer in the top-k, and the rerank pushed it out.",
  "rerank-did-not-lift-gold":
    "The answer was in the rerank pool but stayed below k after reranking.",
  "ndcg-gain-below-target":
    "Reranking did not lift nDCG enough over the baseline ranking.",
  "model-calls-over-budget": "More model calls per question than allowed.",
  "no-citation":
    "The model answered without a citation in the required format.",
  "citation-outside-gold-span":
    "The model cited a chunk that does not contain the answer.",
  "hallucinated-citation":
    "The model cited a chunk id that was not in the retrieved context.",
  "format-drift": "Too many answers missed the required citation format.",
  "over-refusal": "The model refused questions the context could answer.",
  "under-refusal":
    "The model answered questions the context cannot answer instead of refusing.",
  "passage-not-from-corpus":
    "Some passages are not a contiguous span of one corpus document.",
  "right-doc-wrong-span":
    "You returned the right document, but not the part that holds the answer.",
  "gold-doc-not-returned":
    "None of your passages came from the answer's document.",
  "flag-mismatch": "The submitted flag is not your flag for this level.",
  "stale-version-in-context":
    "Another version of the same policy reached the context, so two answers disagree.",
  "deduped-away":
    "The answer page was dropped as a duplicate of a higher-ranked page: the threshold is too loose.",
  "packed-out-by-budget":
    "The answer page was retrieved, but higher-ranked pages filled the token budget first.",
  "post-filter-dropped-results":
    "The filter ran after top-k and threw results away, so fewer chunks than k reached the context.",
};

const CLASS_LABEL: Record<string, string> = {
  faq: "FAQ questions",
  policy: "Policy questions",
  procedural: "Procedural questions",
};

export function failureClassCopy(code: string): string | null {
  const [prefix, rest] = code.includes(":") ? code.split(":", 2) : [null, code];
  const copy = COPY[rest];
  if (!copy) {
    return null;
  }
  return prefix && CLASS_LABEL[prefix]
    ? `${CLASS_LABEL[prefix]}: ${copy}`
    : copy;
}

export const EVAL_TAG_LABEL: Record<string, string> = {
  lexical: "Same wording as the doc",
  paraphrase: "Reworded questions",
  numeric: "Numbers and limits",
  "multi-sentence": "Multi-sentence answers",
  unanswerable: "Not in the corpus",
  distractor: "Another doc looks closer",
  "id-lookup": "Asked by model number or code",
  "stale-version": "Older versions exist",
  faq: "FAQ",
  policy: "Policy",
  procedural: "Procedural",
};
