import { apiClient } from "@/lib/api-client";
import type {
  RagLabContext,
  RagLabEstimate,
  RagLabPreview,
  RagTargetReply,
} from "./rag-lab-types";

export const ragLabApi = {
  getContext: (slug: string) => apiClient<RagLabContext>(`/exercises/${slug}/rag-lab`),
  preview: (
    slug: string,
    payload: Record<string, unknown>,
    question?: string,
    queryClass?: string | null,
  ) =>
    apiClient<RagLabPreview>(`/exercises/${slug}/rag-lab/preview`, {
      method: "POST",
      body: JSON.stringify({ payload, question, queryClass: queryClass ?? undefined }),
    }),
  target: (slug: string, message: string) =>
    apiClient<RagTargetReply>(`/exercises/${slug}/rag-lab/target`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  estimate: (slug: string, payload: Record<string, unknown>) =>
    apiClient<RagLabEstimate>(`/exercises/${slug}/rag-lab/estimate`, {
      method: "POST",
      body: JSON.stringify({ payload }),
    }),
};
