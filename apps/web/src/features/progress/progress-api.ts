import { apiClient } from "@/lib/api-client";
import type { Progress } from "@/types/progress";

export const progressApi = {
  getMine: () => apiClient<Progress>("/me/progress"),
};
