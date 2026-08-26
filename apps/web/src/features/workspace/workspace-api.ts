import { apiClient, ApiError } from "@/lib/api-client";
import type { Attempt } from "@/types/attempt";
import type { Grade } from "@/types/grade";
import type { QueuedSubmission, Run } from "@/types/run";

const TERMINAL: Run["status"][] = ["succeeded", "failed", "killed_budget"];

export const workspaceApi = {
  startAttempt: (exerciseSlug: string) =>
    apiClient<Attempt>("/attempts", {
      method: "POST",
      body: JSON.stringify({ exerciseSlug }),
    }),
  submit: (attemptId: string, payload: Record<string, unknown>) =>
    apiClient<QueuedSubmission>(`/attempts/${attemptId}/submissions`, {
      method: "POST",
      body: JSON.stringify({ payload }),
    }),
  getRun: (runId: string) => apiClient<Run>(`/runs/${runId}`),
  getGrade: (runId: string) => apiClient<Grade>(`/runs/${runId}/grade`),
};

export async function waitForRun(
  runId: string,
  onUpdate: (run: Run) => void,
  signal?: AbortSignal,
): Promise<Run> {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    const run = await workspaceApi.getRun(runId);
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    onUpdate(run);
    if (TERMINAL.includes(run.status)) {
      return run;
    }
    await sleep(400);
  }
  throw new Error("Timed out waiting for the run to finish");
}

export async function waitForGrade(
  runId: string,
  signal?: AbortSignal,
): Promise<Grade> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    try {
      return await workspaceApi.getGrade(runId);
    } catch (error) {
      lastError = error;
      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error;
      }
      await sleep(200);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Grade not ready");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
