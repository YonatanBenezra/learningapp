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
