import { apiClient, ApiError } from "@/lib/api-client";
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
    /** R4: run the rewrite prompt on the live model (one call). */
    runRewrite = false,
  ) =>
    apiClient<RagLabPreview>(`/exercises/${slug}/rag-lab/preview`, {
      method: "POST",
      body: JSON.stringify({
        payload,
        question,
        queryClass: queryClass ?? undefined,
        ...(runRewrite ? { runRewrite: true } : {}),
      }),
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

/**
 * Learner-readable message for a failed lab call. The lab endpoints need a
 * signed-in session (401), are rate limited (429) and R3 previews call a real
 * model that can be unavailable (503).
 */
export function ragLabErrorMessage(caught: unknown, fallback: string): string {
  if (caught instanceof ApiError) {
    const detail = /^Request failed \(\d+\)$/.test(caught.message)
      ? ""
      : caught.message.trim().replace(/\.$/, "");
    if (caught.status === 401) {
      return "Your session has expired. Sign in again to use the Simulation Lab.";
    }
    if (caught.status === 429) {
      // The API message already says when to retry ("Try again in 12s.").
      return detail ? `${detail}.` : "Too many lab requests. Wait a moment, then try again.";
    }
    if (caught.status === 503) {
      return detail
        ? `${detail}. Try again later.`
        : "The AI model is unavailable right now. Try again later.";
    }
    return detail || fallback;
  }
  if (caught instanceof TypeError) {
    return "Could not reach the lab service. Check your connection and try again.";
  }
  return caught instanceof Error && caught.message ? caught.message : fallback;
}
