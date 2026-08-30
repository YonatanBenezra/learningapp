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
};
