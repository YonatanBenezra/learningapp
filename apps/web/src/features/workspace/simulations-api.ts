import { apiClient } from "@/lib/api-client";

export type G1Turn = {
  level: number;
  reply: string;
  won: boolean;
  encoding: string | null;
  filtered: boolean;
  attackAttempt: boolean;
  exerciseSlug?: string;
};

export type G2Run = {
  level: number;
  summary: string;
  tools: Array<{ tool: string; args: Record<string, unknown> }>;
  denied: boolean;
  won: boolean;
};

/** One message through a G3 stack, layer by layer (secret masked). */
export type G3Probe = {
  note: string;
  message: string;
  input: { blocked: boolean; failed: string[] };
  reply: string | null;
  tools: {
    tool: string;
    args: Record<string, unknown>;
    allowed: boolean;
    reason: string;
    stripped: string[];
  }[];
  output: { blocked: boolean; redacted: boolean; failed: string[] };
  shown: string;
  attack: boolean;
  harmsLeft: string[];
  taskDone: boolean | null;
  judgeCalls: number;
  classifierCalls: number;
  addedLatencyMs: number;
};

export type G3Stack = {
  systemPrompt: string;
  inputFilterYaml: string;
  outputFilterYaml: string;
  toolPolicyYaml?: string;
};

export type G3StageCheck = {
  level: number;
  passed: boolean;
  results: {
    id: string;
    kind: "attack" | "guest";
    message: string;
    ok: boolean;
    why: string | null;
    shown: string;
  }[];
  /** Tools this win opened that were not held before. */
  unlocked: string[];
};

export const simulationsApi = {
  g1Turn: (exerciseSlug: string, level: number, message: string) =>
    apiClient<G1Turn>("/simulations/g1/turns", {
      method: "POST",
      body: JSON.stringify({ level, message, exerciseSlug }),
    }),

  g2Page: (exerciseSlug: string, level: number, pageContent: string) =>
    apiClient<G2Run>("/simulations/g2/page", {
      method: "POST",
      body: JSON.stringify({ level, pageContent, exerciseSlug }),
    }),

  g3Probe: (exerciseSlug: string, message: string, stack: G3Stack) =>
    apiClient<G3Probe>("/simulations/g3/probe", {
      method: "POST",
      body: JSON.stringify({ exerciseSlug, message, ...stack }),
    }),

  /** A staged G3 level: its messages through the stack; a win opens the next layer. */
  g3StageCheck: (exerciseSlug: string, level: number, stack: G3Stack) =>
    apiClient<G3StageCheck>("/simulations/g3/stage-check", {
      method: "POST",
      body: JSON.stringify({ exerciseSlug, level, ...stack }),
    }),

  /** The exercise's three levels and what defends each (G1/G2). */
  levels: (exerciseSlug: string) =>
    apiClient<{ level: number; title: string; defense: string }[]>(
      `/simulations/levels?exerciseSlug=${encodeURIComponent(exerciseSlug)}`,
    ),
};
