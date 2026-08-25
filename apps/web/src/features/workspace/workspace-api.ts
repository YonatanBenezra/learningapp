import { apiClient } from "@/lib/api-client";
import type { Attempt } from "@/types/attempt";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";

export const workspaceApi = {
  startAttempt: (exerciseSlug: string) =>
    apiClient<Attempt>("/attempts", {
      method: "POST",
      body: JSON.stringify({ exerciseSlug }),
    }),
  submit: (attemptId: string, payload: Record<string, unknown>) =>
    apiClient<Run>(`/attempts/${attemptId}/submissions`, {
      method: "POST",
      body: JSON.stringify({ payload }),
    }),
  getRun: (runId: string) => apiClient<Run>(`/runs/${runId}`),
  getGrade: (runId: string) => apiClient<Grade>(`/runs/${runId}/grade`),
};
