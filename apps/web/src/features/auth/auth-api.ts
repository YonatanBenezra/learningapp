import { apiClient } from "@/lib/api-client";
import type { User } from "@/types/user";

export const authApi = {
  requestMagicLink: (email: string) =>
    apiClient<void>("/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  consumeMagicLink: (token: string) =>
    apiClient<User>("/auth/magic-link/consume", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  logout: () => apiClient<void>("/auth/logout", { method: "POST" }),
};
