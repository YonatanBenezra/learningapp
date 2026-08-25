import { apiClient } from "@/lib/api-client";

export const progressApi = {
  getMine: () => apiClient<unknown>("/me/progress"),
};
