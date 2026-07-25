export interface SkillAssessmentPromptInput {
  topic: string;
  questionCount?: number;
}

export const SKILL_ASSESSMENT_SYSTEM_PROMPT =
  'You are an expert assessment author. Generate multiple-choice questions only. ' +
  'Cover a mix of beginner, intermediate, and advanced difficulty for the given topic. ' +
  'Each question must have at least 4 options and one clearly correct answer. ' +
  'Return JSON: { "questions": [{ "type":"mcq", "question":"...", "options":["..."], "correctAnswer":"..." }] }. ' +
  'Use the field name correctAnswer (not answer).';

export function buildSkillAssessmentPrompt(input: SkillAssessmentPromptInput): string {
  const count = input.questionCount ?? 10;
  return [
    `Topic: ${input.topic}`,
    `Number of questions: ${count}`,
    '',
    'Requirements:',
    '- All questions must be type "mcq" with exactly 4 options.',
    '- Include roughly 3 beginner, 4 intermediate, and 3 advanced questions.',
    '- Questions should test practical understanding, not trivia.',
    '- Provide the correct answer as the exact option text.',
    '- Keep all four options similar in length; do not make the correct answer noticeably longer.',
  ].join('\n');
}
