/** A tool on a simulator's ladder: RAG controls or a G3 defence layer. */
export type ToolState = "new" | "unlocked" | "locked";

export type ToolSummary = {
  id: string;
  step: number;
  title: string;
  blurb: string;
  /** Submission fields this tool sets. */
  fields: string[];
  /** G3 defence-language features this tool adds. */
  features: string[];
  /** The exercise that teaches it. */
  teachesIn: { slug: string; title: string };
};

export type ExerciseTool = ToolSummary & { state: ToolState };

/** The tools an exercise's practice workspace shows. */
export type ExerciseTools = {
  track: "rag" | "g3" | null;
  /** Rating points to unlock a tool early. */
  cost: number;
  tools: ExerciseTool[];
};

export type LadderTool = ToolSummary & {
  unlocked: boolean;
  via: "solved" | "bought" | "level" | null;
};

export type ToolTrack = { id: "rag" | "g3"; title: string; tools: LadderTool[] };

/** A G1 or G2 attack exercise: each level beaten is a badge. */
export type AttackExercise = {
  slug: string;
  title: string;
  levelsWon: number;
  levels: number;
  solved: boolean;
};

export type AttackTrack = {
  id: "g1" | "g2";
  title: string;
  exercises: AttackExercise[];
};

export type ToolLadders = {
  /** Rating points to unlock a tool early. */
  cost: number;
  /** Rating points spent unlocking tools early. */
  spent: number;
  tracks: ToolTrack[];
  attacks: AttackTrack[];
};
