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
  /** The staged level of that exercise that opens it, if any. */
  level: number | null;
};

export type ExerciseTool = ToolSummary & {
  state: ToolState;
  /** How a locked tool opens here, when it is not "solve another exercise". */
  lockNote: string | null;
};

/** A staged level inside an exercise (G3 grd-013). */
export type ToolStage = {
  level: number;
  title: string;
  goal: string;
  /** The tool this level teaches. */
  teaches: string;
  /** The tool winning it unlocks; null on the last level. */
  unlocks: string | null;
  cases: { id: string; kind: "attack" | "guest"; text: string }[];
  state: "done" | "current" | "locked";
};

/** The tools an exercise's practice workspace shows. */
export type ExerciseTools = {
  track: "rag" | "g3" | null;
  /** Rating points to unlock a tool early. */
  cost: number;
  tools: ExerciseTool[];
  /** Staged levels inside this exercise; empty for most exercises. */
  stages: ToolStage[];
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
