export type AttemptStatus =
  | "started"
  | "submitted"
  | "grading"
  | "graded"
  | "abandoned";

export type Attempt = {
  id: string;
  exerciseSlug: string;
  status: AttemptStatus;
};

/** GET /exercises/:slug/attempt-budget: graded submissions left in the policy window. */
export type AttemptBudget = {
  /** null when the exercise has no submission limit. */
  max: number | null;
  windowHours: number;
  used: number;
  remaining: number | null;
  /** ISO time the oldest submission in the window expires; null when none. */
  resetsAt: string | null;
};
