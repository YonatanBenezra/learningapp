import { apiClient } from "@/lib/api-client";
import type { RunTrace } from "@/types/trace";

export const tracesApi = {
  getByRunId: (runId: string) => apiClient<RunTrace>(`/runs/${runId}/trace`),
};
