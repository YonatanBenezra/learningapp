import { apiClient } from "@/lib/api-client";

export const tracesApi = {
  getByRunId: (runId: string) => apiClient<unknown>(`/runs/${runId}/trace`),
};
