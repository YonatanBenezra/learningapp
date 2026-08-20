// Prompt templates for Exam generation (§1.7). Consumed by exam.service (Phase 5).
export interface ExamPromptInput {
  scope: 'module' | 'course';
  scopeTitle: string;
  topics: string[];
  questionCount?: number;
}

export const EXAM_SYSTEM_PROMPT =
  'You are an assessment author. Generate a broader assessment spanning multiple ' +
  'lessons for the given scope. Return JSON with a top-level questions array. Each question ' +
  'must use type "mcq" or "short_answer" and correctAnswer (not answer).';

export function buildExamPrompt(input: ExamPromptInput): string {
  return [
    `Scope: ${input.scope} — ${input.scopeTitle}`,
    `Topics: ${input.topics.join(', ')}`,
    `Number of questions: ${input.questionCount ?? 10}`,
    '',
    'Generate a comprehensive exam with a mix of question types.',
    'Return exactly this JSON shape:',
    '{',
    '  "questions": [',
    '    { "question": "...", "type": "mcq", "options": ["A","B","C","D"], "correctAnswer": "A" }',
    '  ]',
    '}',
  ].join('\n');
}
