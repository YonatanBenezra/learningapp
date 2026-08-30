import { apiClient } from "@/lib/api-client";

export const billingApi = {
  checkout: (interval: "monthly" | "annual") =>
    apiClient<{ url: string }>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ interval }),
    }),
  portal: () =>
    apiClient<{ url: string }>("/billing/portal", { method: "POST" }),
};
