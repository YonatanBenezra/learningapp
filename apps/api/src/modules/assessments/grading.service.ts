import { z } from 'zod';
import { getAiClient } from '../ai-guidance/ai.client';
import { AiError } from '../ai-guidance/ai.error';
import type { GeneratedQuestion, SubmittedAnswer, GradedResult } from './assessment.schema';

const normalize = (s: string): string => s.trim().toLowerCase();

function parseAiBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['true', 'yes', 'correct', 'pass', 'passed', '1'].includes(v)) return true;
    if (['false', 'no', 'incorrect', 'wrong', 'fail', 'failed', '0'].includes(v)) return false;
    if (v.includes('partial')) return false;
  }
  return false;
}

const ShortAnswerJudgmentSchema = z
  .object({
    correct: z.union([z.boolean(), z.string(), z.number()]).optional(),
    is_correct: z.union([z.boolean(), z.string(), z.number()]).optional(),
    isCorrect: z.union([z.boolean(), z.string(), z.number()]).optional(),
    feedback: z.string().optional(),
    comment: z.string().optional(),
    explanation: z.string().optional(),
    reason: z.string().optional(),
  })
  .passthrough()
  .transform((data) => ({
    correct: parseAiBoolean(data.correct ?? data.is_correct ?? data.isCorrect),
    feedback: (
      data.feedback ??
      data.comment ??
      data.explanation ??
      data.reason ??
      'Graded.'
    ).trim(),
  }))
  .pipe(
    z.object({
      correct: z.boolean(),
      feedback: z.string().min(1),
    }),
  );

export type ShortAnswerJudge = (
  question: string,
  referenceAnswer: string,
  userAnswer: string,
) => Promise<{ correct: boolean; feedback: string }>;

function fallbackShortAnswerGrade(referenceAnswer: string, userAnswer: string) {
  const user = normalize(userAnswer);
  const ref = normalize(referenceAnswer);
  if (!user) return { correct: false, feedback: 'No answer provided.' };
  const correct = user === ref || ref.includes(user) || user.includes(ref);
  return {
    correct,
    feedback: correct
      ? 'Your answer matches the reference closely enough.'
      : 'Your answer does not match the reference closely enough.',
  };
}

// Default AI-backed short-answer judge (§1.7). Injectable so tests avoid the provider.
export const judgeShortAnswer: ShortAnswerJudge = async (question, referenceAnswer, userAnswer) => {
  if (!userAnswer.trim()) return { correct: false, feedback: 'No answer provided.' };
  try {
    const result = await getAiClient().completeStructured(
      {
        system:
          'You are a fair grader. Decide whether the student answer is essentially correct ' +
          'compared to the reference answer, then give one short sentence of feedback. ' +
          'Return JSON with boolean correct and string feedback.',
        prompt: `Question: ${question}\nReference answer: ${referenceAnswer}\nStudent answer: ${userAnswer}`,
        useCase: 'grading',
      },
      ShortAnswerJudgmentSchema,
    );
    return result.data;
  } catch (err) {
    if (err instanceof AiError) {
      return fallbackShortAnswerGrade(referenceAnswer, userAnswer);
    }
    throw err;
  }
};

// Grades a submission: MCQ is rule-based (no AI call); short-answer uses the judge.
export async function gradeSubmission(
  questions: GeneratedQuestion[],
  answers: SubmittedAnswer[],
  judge: ShortAnswerJudge = judgeShortAnswer,
): Promise<{ score: number; results: GradedResult[] }> {
  const byIndex = new Map(answers.map((a) => [a.questionIndex, a.answer]));
  const results: GradedResult[] = [];

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    const userAnswer = byIndex.get(i) ?? '';
    if (q.type === 'mcq') {
      const correct = normalize(userAnswer) === normalize(q.correctAnswer);
      results.push({
        questionIndex: i,
        correct,
        correctAnswer: q.correctAnswer,
        feedback: correct ? 'Correct.' : 'Incorrect.',
      });
    } else {
      const { correct, feedback } = await judge(q.question, q.correctAnswer, userAnswer);
      results.push({ questionIndex: i, correct, correctAnswer: q.correctAnswer, feedback });
    }
  }

  const correctCount = results.filter((r) => r.correct).length;
  const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  return { score, results };
}
