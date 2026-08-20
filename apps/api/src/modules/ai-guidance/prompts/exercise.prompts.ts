// Prompt templates for Exercise generation (§1.6). Consumed by exercise.service (Phase 6).
export interface ExercisePromptInput {
  lessonTitle: string;
  lessonSummary: string;
  domain: string;
}

export const EXERCISE_SYSTEM_PROMPT =
  'You are a hands-on lab designer. Generate a single practical exercise with a clear ' +
  'task description, starter state, and grading rubric appropriate to the lesson domain. ' +
  'Return JSON with top-level keys: description (string), starterState (object), rubric (object). ' +
  'For coding tasks, put starter code in starterState.code and language in starterState.language.';

export function buildExercisePrompt(input: ExercisePromptInput): string {
  return [
    `Domain: ${input.domain}`,
    `Lesson: ${input.lessonTitle}`,
    `Lesson summary: ${input.lessonSummary}`,
    '',
    'Design one hands-on exercise.',
    'Return exactly this JSON shape:',
    '{',
    '  "description": "step-by-step task instructions",',
    '  "starterState": { "code": "...", "language": "javascript" },',
    '  "rubric": { "criteria": ["..."] }',
    '}',
  ].join('\n');
}
