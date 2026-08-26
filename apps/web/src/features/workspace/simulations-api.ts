import { apiClient } from "@/lib/api-client";

export type G1Turn = {
  level: number;
  reply: string;
  won: boolean;
  encoding: string | null;
  filtered: boolean;
};

export const simulationsApi = {
  g1Turn: (level: number, message: string) =>
    apiClient<G1Turn>("/simulations/g1/turns", {
      method: "POST",
      body: JSON.stringify({ level, message }),
    }),
};
