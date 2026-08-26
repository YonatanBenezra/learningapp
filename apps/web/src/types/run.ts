export type RunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "killed_budget";

export type Run = {
  id: string;
  status: RunStatus;
  errorCode?: string | null;
  errorMessage?: string | null;
  tokensIn?: number;
  tokensOut?: number;
  costEurMicros?: number;
  exerciseSlug?: string;
  title?: string;
};

export type QueuedSubmission = {
  submissionId: string;
  runId: string;
  status: RunStatus;
};
