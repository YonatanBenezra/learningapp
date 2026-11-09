import type { ArenaCategoryId, ArenaDifficulty } from "@/features/contests/arena/lib/categories";

export const HTB_CATEGORY_COLOR: Record<ArenaCategoryId, string> = {
  retrieval: "#2F8BFF",
  guardrails: "#8B7CFF",
  "prompt-injection": "#FF5A7A",
  evals: "#FFAF00",
  exfiltration: "#34E0A1",
};

export const HTB_DIFFICULTY: Record<
  ArenaDifficulty,
  { color: string; bg: string }
> = {
  Easy: { color: "#9FEF00", bg: "rgba(159, 239, 0, 0.1)" },
  Medium: { color: "#FFAF00", bg: "rgba(255, 175, 0, 0.1)" },
  Hard: { color: "#FF3E3E", bg: "rgba(255, 62, 62, 0.1)" },
  Insane: { color: "#B45CFF", bg: "rgba(180, 92, 255, 0.1)" },
};
