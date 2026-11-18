import type { Verdict } from "./grade";
import type { RunStatus } from "./run";

/** One row of GET /exercises/:slug/submissions (the learner's own history). */
export type SubmissionHistoryItem = {
  submissionId: string;
  createdAt: string;
  payload: Record<string, unknown>;
  contest: boolean;
  run: {
    id: string;
    status: RunStatus;
    startedAt: string | null;
    finishedAt: string | null;
  } | null;
  grade: {
    verdict: Verdict;
    gateResults: unknown;
    metrics: unknown;
    /** Count-only hidden-set breakdown (RAG). */
    breakdown?: unknown;
  } | null;
};
