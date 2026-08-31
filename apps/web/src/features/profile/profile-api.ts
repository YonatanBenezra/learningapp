import { apiClient } from "@/lib/api-client";
import type { PublicProfile } from "@/types/profile";

export const profileApi = {
  getPublic: (slug: string) =>
    apiClient<PublicProfile>(`/profiles/${encodeURIComponent(slug)}`),
};
