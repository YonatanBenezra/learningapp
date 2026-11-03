import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  Database,
  Shield,
  Syringe,
  Target,
} from "lucide-react";

export type ArenaCategoryId =
  | "prompt-injection"
  | "retrieval"
  | "guardrails"
  | "evals"
  | "exfiltration";

export type ArenaCategoryMeta = {
  id: ArenaCategoryId;
  name: string;
  colorVar: string;
  Icon: LucideIcon;
};

export const ARENA_CATEGORIES: Record<ArenaCategoryId, ArenaCategoryMeta> = {
  "prompt-injection": {
    id: "prompt-injection",
    name: "Prompt Injection",
    colorVar: "var(--arena-red)",
    Icon: Syringe,
  },
  retrieval: {
    id: "retrieval",
    name: "Retrieval",
    colorVar: "var(--arena-cyan)",
    Icon: Database,
  },
  guardrails: {
    id: "guardrails",
    name: "Guardrails",
    colorVar: "var(--arena-purple)",
    Icon: Shield,
  },
  evals: {
    id: "evals",
    name: "Evals",
    colorVar: "var(--arena-amber)",
    Icon: Target,
  },
  exfiltration: {
    id: "exfiltration",
    name: "Exfiltration",
    colorVar: "var(--arena-lime-fg)",
    Icon: ArrowDownToLine,
  },
};

export type ArenaDifficulty = "Easy" | "Medium" | "Hard" | "Insane";

export const DIFFICULTY_TONE: Record<
  ArenaDifficulty,
  "played" | "advanced" | "live" | "insane"
> = {
  Easy: "played",
  Medium: "advanced",
  Hard: "live",
  Insane: "insane",
};

export function normalizeDifficulty(raw: string): ArenaDifficulty {
  const map: Record<string, ArenaDifficulty> = {
    E: "Easy",
    M: "Medium",
    H: "Hard",
    I: "Insane",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    insane: "Insane",
  };
  return map[raw] ?? "Medium";
}

const AVATAR_PALETTE = [
  "var(--arena-cyan)",
  "var(--arena-purple)",
  "var(--arena-amber)",
  "var(--arena-lime-fg)",
  "var(--arena-red)",
  "#FF7A3D",
] as const;

export function avatarColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % 997;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

/** Arena scoreboard / table avatars — e.g. `nadia.k` → NK, `rafi_dev` → RD */
export function avatarInitialsForName(name: string): string {
  const parts = name.trim().split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return "?";
}
