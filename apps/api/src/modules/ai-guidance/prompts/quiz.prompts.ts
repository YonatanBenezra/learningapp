// Prompt templates for Quiz generation (§1.7). Consumed by quiz.service (Phase 5).
export interface QuizPromptInput {
  lessonTitle: string;
  lessonSummary: string;
  questionCount?: number;
}

export const QUIZ_SYSTEM_PROMPT =
  'You are an assessment author. Generate MCQ and short-answer questions that check ' +
  "understanding of the lesson. Return JSON with a top-level questions array. Each question " +
  'must use type "mcq" or "short_answer" and correctAnswer (not answer).';

export function buildQuizPrompt(input: QuizPromptInput): string {
  return [
    `Lesson: ${input.lessonTitle}`,
    `Lesson summary: ${input.lessonSummary}`,
    `Number of questions: ${input.questionCount ?? 10}`,
    '',
    'Generate a mix of multiple-choice and short-answer questions.',
    'Return exactly this JSON shape:',
    '{',
    '  "questions": [',
    '    {',
    '      "question": "...",',
    '      "type": "mcq",',
    '      "options": ["A", "B", "C", "D"],',
    '      "correctAnswer": "A"',
    '    },',
    '    {',
    '      "question": "...",',
    '      "type": "short_answer",',
    '      "options": null,',
    '      "correctAnswer": "reference answer"',
    '    }',
    '  ]',
    '}',
  ].join('\n');
}
