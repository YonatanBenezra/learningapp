export type RagLabArchetype =
  | "r1"
  | "r2"
  | "r3"
  | "r4"
  | "r5"
  | "redteam"
  | "sandbox"
  | "unknown";

export type RagLabDoc = {
  id: string;
  title: string;
  text: string;
};

export type RagLabQuestion = {
  id: string;
  question: string;
  answerable: boolean;
  goldAnswer: string | null;
  /** R5 query class (faq / policy / procedural). */
  class?: string | null;
};

export type RagLabContext = {
  slug: string;
  archetype: RagLabArchetype;
  corpus: RagLabDoc[];
  questions: RagLabQuestion[];
  frozen: { label: string; items: string[] } | null;
  labEnabled: boolean;
  /** Red team exercises: the target bot's display name. */
  target?: { botName: string } | null;
};

export type RagLabChunk = {
  id: string;
  docId: string;
  title: string;
  text: string;
};

export type RagLabHit = {
  chunkId: string;
  docId: string;
  title: string;
  score: number;
  text: string;
  /** Public sample questions only: the chunk carries the gold sentence. */
  containsAnswer?: boolean | null;
};

export type RagLabPreview = {
  archetype: RagLabArchetype;
  chunkCount: number;
  chunks: RagLabChunk[];
  retrieved: RagLabHit[];
  baseline: RagLabHit[] | null;
  generation: string | null;
  citations: string[];
  refused: boolean;
  /** Same per-question token count the grader averages for this archetype. */
  contextTokens: number;
  /** Public sample questions only: the gold sentence is somewhere in the context. */
  answerFound?: boolean | null;
  frozen: { label: string; items: string[] } | null;
};

export type RagLabEstimateRow = {
  id: string;
  question: string;
  answerable: boolean;
  contextTokens: number;
  answerFound: boolean | null;
  goldRank: number | null;
  firstStageGoldRank: number | null;
};

/** The current config over every public sample question (not a grade). */
export type RagLabEstimate = {
  archetype: RagLabArchetype;
  questions: number;
  meanContextTokens: number;
  answerable: number;
  answersFound: number;
  rows: RagLabEstimateRow[];
};

/** Reply from a red team exercise's vulnerable target bot. */
export type RagTargetReply = {
  reply: string;
  citations: { chunkId: string; docId: string; title: string }[];
  blocked: boolean;
};
