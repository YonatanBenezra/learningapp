import { apiClient } from "@/lib/api-client";
import type { User } from "@/types/user";

export const authApi = {
  me: () => apiClient<User>("/me"),
  requestMagicLink: (email: string) =>
    apiClient<{ ok: true; token?: string }>("/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  consumeMagicLink: (token: string) =>
    apiClient<{ user: User }>("/auth/magic-link/consume", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  logout: () => apiClient<void>("/auth/logout", { method: "POST" }),
  updateProfile: (body: {
    displayName?: string | null;
    slug?: string | null;
    enabled?: boolean;
  }) =>
    apiClient<NonNullable<User["profile"]>>("/me/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
