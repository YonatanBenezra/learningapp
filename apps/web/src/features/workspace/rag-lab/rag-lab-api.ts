import { apiClient } from "@/lib/api-client";
import type { RagLabContext, RagLabPreview } from "./rag-lab-types";

export const ragLabApi = {
  getContext: (slug: string) => apiClient<RagLabContext>(`/exercises/${slug}/rag-lab`),
  preview: (slug: string, payload: Record<string, unknown>, question?: string) =>
    apiClient<RagLabPreview>(`/exercises/${slug}/rag-lab/preview`, {
      method: "POST",
      body: JSON.stringify({ payload, question }),
    }),
};
