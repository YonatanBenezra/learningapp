import { G1_LEVELS } from "./guardrails-workspace-data";

export type G1LevelWin = {
  level: number;
  attempts: number;
  encoding: string | null;
  clearedAt: string;
};

export type G1Debrief = {
  level: number;
  levelTitle: string;
  summary: string;
  defence: string;
  technique: string;
  nextLevelAdds: string;
};

const TECHNIQUE_BY_ENCODING: Record<string, string> = {
  spaced: "Role impersonation + spaced letters",
  literal: "Direct override request",
  hex: "Hex-encoded canary request",
  base64: "Base64 canary exfil",
  rot13: "ROT13 canary encoding",
  reversed: "Reversed canary string",
};

export function buildG1Debrief(win: G1LevelWin): G1Debrief {
  const meta = G1_LEVELS.find((row) => row.level === win.level) ?? G1_LEVELS[0];
  const technique =
    (win.encoding && TECHNIQUE_BY_ENCODING[win.encoding]) ||
    "Social engineering against system prompt";

  const next = G1_LEVELS.find((row) => row.level === win.level + 1);

  return {
    level: win.level,
    levelTitle: meta.title,
    summary:
      win.level === 1
        ? "Your prompt coaxed the concierge into leaking the canary on an undefended front desk."
        : win.level === 2
          ? "Your prompt bypassed the hardened system prompt via staff-role framing and encoding."
          : "You cleared the output-filter level — the canary appeared in the assistant reply.",
    defence: meta.defense,
    technique,
    nextLevelAdds: next ? next.title : "Submit your winning attack for hidden grading.",
  };
}

export function canaryPreview(encoding: string | null): string {
  if (encoding === "spaced") {
    return "BOOK-••••-7Q";
  }
  if (encoding) {
    return `canary (${encoding})`;
  }
  return "BOOK-••••-7Q";
}
