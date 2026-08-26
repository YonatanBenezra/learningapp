import { apiClient } from "@/lib/api-client";
import type { HintList } from "@/types/hint";

export const hintsApi = {
  list: (slug: string) => apiClient<HintList>(`/exercises/${slug}/hints`),
  unlockNext: (slug: string) =>
    apiClient<HintList>(`/exercises/${slug}/hints/next`, { method: "POST" }),
};
