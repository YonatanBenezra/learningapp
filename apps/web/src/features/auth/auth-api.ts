import { apiClient } from "@/lib/api-client";
import type { User } from "@/types/user";

export const authApi = {
  me: () => apiClient<User>("/me"),
  register: (body: { username: string; email: string; password: string }) =>
    apiClient<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (login: string, password: string) =>
    apiClient<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    }),
  refresh: () =>
    apiClient<{ user: User }>("/auth/refresh", {
      method: "POST",
      body: "{}",
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
