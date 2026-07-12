// Prompt templates for Exam generation (§1.7). Consumed by exam.service (Phase 5).
export interface ExamPromptInput {
  scope: 'module' | 'course';
  scopeTitle: string;
  topics: string[];
  questionCount?: number;
}

export const EXAM_SYSTEM_PROMPT =
  'You are an assessment author. Generate a broader assessment spanning multiple ' +
  "lessons for the given scope. Provide each question's correct/reference answer.";

export function buildExamPrompt(input: ExamPromptInput): string {
  return [
    `Scope: ${input.scope} — ${input.scopeTitle}`,
    `Topics: ${input.topics.join(', ')}`,
    `Number of questions: ${input.questionCount ?? 10}`,
    '',
    'Generate a comprehensive exam with a mix of question types and answers.',
  ].join('\n');
}
