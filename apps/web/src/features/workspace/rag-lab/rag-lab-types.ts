export type RagLabArchetype = "r1" | "r2" | "r3" | "r4" | "sandbox" | "unknown";

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
};

export type RagLabContext = {
  slug: string;
  archetype: RagLabArchetype;
  corpus: RagLabDoc[];
  questions: RagLabQuestion[];
  frozen: { label: string; items: string[] } | null;
  labEnabled: boolean;
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
