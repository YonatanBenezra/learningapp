import { apiClient } from "@/lib/api-client";
import type { Progress } from "@/types/progress";

function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export const progressApi = {
  getMine: (timezone = browserTimeZone()) =>
    apiClient<Progress>(
      `/me/progress?timezone=${encodeURIComponent(timezone)}`,
    ),
};
