export type SubmissionStatus = 'submitted' | 'grading' | 'graded';

export interface ExerciseTaskSpec {
  description: string;
  starterState: unknown;
  rubric: unknown;
}

export interface Exercise {
  id: string;
  lessonId: string;
  domain: string;
  taskSpec: ExerciseTaskSpec;
}

export interface ExerciseSubmission {
  id: string;
  exerciseId: string;
  submissionData: unknown;
  score: number | null;
  feedback: string | null;
  status: SubmissionStatus;
}
