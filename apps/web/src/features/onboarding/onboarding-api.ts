import { apiClient } from "@/lib/api-client";

export const onboardingApi = {
  track: (name: "first_submit" | "first_pass") =>
    apiClient<{ name: string; elapsedMs: number }>("/me/events", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
};
