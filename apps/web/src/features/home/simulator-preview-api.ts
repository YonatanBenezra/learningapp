import { apiClient } from "@/lib/api-client";

export type SimulatorPreviewRequest = {
  simulationId: string;
  tabId: "python" | "json" | "yaml";
  code: string;
  slug: string;
};

export type SimulatorPreviewResponse = {
  output: string;
  verdict: "pass" | "fail" | "preview";
  source: "harness" | "ai";
};

export const simulatorPreviewApi = {
  grade: (body: SimulatorPreviewRequest) =>
    apiClient<SimulatorPreviewResponse>("/demo/simulator-preview", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
