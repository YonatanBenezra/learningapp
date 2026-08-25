export type RunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "killed_budget";

export type Run = {
  id: string;
  status: RunStatus;
};
