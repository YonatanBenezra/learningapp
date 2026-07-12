// Prompt templates for Quiz generation (§1.7). Consumed by quiz.service (Phase 5).
export interface QuizPromptInput {
  lessonTitle: string;
  lessonSummary: string;
  questionCount?: number;
}

export const QUIZ_SYSTEM_PROMPT =
  'You are an assessment author. Generate MCQ and short-answer questions that check ' +
  "understanding of the lesson. Provide each question's correct/reference answer.";

export function buildQuizPrompt(input: QuizPromptInput): string {
  return [
    `Lesson: ${input.lessonTitle}`,
    `Lesson summary: ${input.lessonSummary}`,
    `Number of questions: ${input.questionCount ?? 5}`,
    '',
    'Generate a mix of multiple-choice and short-answer questions with answers.',
  ].join('\n');
}
