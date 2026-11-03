import { apiClient } from "@/lib/api-client";
import type { ProfileWorkspace } from "@/features/profile/platform/types";
import type { ProfileMeta } from "@/features/profile/platform/types";

export const profileWorkspaceApi = {
  get: () => apiClient<ProfileWorkspace>("/me/profile/workspace"),
  updateMeta: (body: Partial<ProfileMeta>) =>
    apiClient<ProfileMeta>("/me/profile/meta", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
