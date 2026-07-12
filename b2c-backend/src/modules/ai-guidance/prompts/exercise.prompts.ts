// Prompt templates for Exercise generation (§1.6). Consumed by exercise.service (Phase 6).
export interface ExercisePromptInput {
  lessonTitle: string;
  lessonSummary: string;
  domain: string;
}

export const EXERCISE_SYSTEM_PROMPT =
  'You are a hands-on lab designer. Generate a single practical exercise (task ' +
  'description, starter state, and grading rubric) appropriate to the lesson domain.';

export function buildExercisePrompt(input: ExercisePromptInput): string {
  return [
    `Domain: ${input.domain}`,
    `Lesson: ${input.lessonTitle}`,
    `Lesson summary: ${input.lessonSummary}`,
    '',
    'Design one hands-on exercise with a description, starter state, and rubric.',
  ].join('\n');
}
