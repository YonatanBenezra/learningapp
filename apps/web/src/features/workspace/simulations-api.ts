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
};
