import { apiClient } from "@/lib/api-client";
import type { OwnedSignedResult } from "@/types/profile";

export const signedResultsApi = {
  listMine: () => apiClient<OwnedSignedResult[]>("/me/assessments/results"),
  setShared: (resultId: string, shared: boolean) =>
    apiClient<OwnedSignedResult>(
      `/me/assessments/results/${encodeURIComponent(resultId)}/share`,
      {
        method: "PATCH",
        body: JSON.stringify({ shared }),
      },
    ),
};
