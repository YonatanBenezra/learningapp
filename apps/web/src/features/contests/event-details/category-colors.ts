import type { ArenaCategoryId } from "@/features/contests/arena/lib/categories";

/** HTB event details category accents — match mockup tokens. */
export const EVENT_CATEGORY_COLOR: Record<ArenaCategoryId, string> = {
  "prompt-injection": "#FF5A7A",
  retrieval: "#2F8BFF",
  guardrails: "#8B7CFF",
  evals: "#FFAF00",
  exfiltration: "#34E0A1",
};
