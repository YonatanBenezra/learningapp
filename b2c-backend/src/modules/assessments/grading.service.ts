import { z } from 'zod';
import { getAiClient } from '../ai-guidance/ai.client';
import type { GeneratedQuestion, SubmittedAnswer, GradedResult } from './assessment.schema';

const normalize = (s: string): string => s.trim().toLowerCase();

const ShortAnswerJudgmentSchema = z.object({
  correct: z.boolean(),
  feedback: z.string(),
});

export type ShortAnswerJudge = (
  question: string,
  referenceAnswer: string,
  userAnswer: string,
) => Promise<{ correct: boolean; feedback: string }>;

// Default AI-backed short-answer judge (§1.7). Injectable so tests avoid the provider.
export const judgeShortAnswer: ShortAnswerJudge = async (question, referenceAnswer, userAnswer) => {
  if (!userAnswer.trim()) return { correct: false, feedback: 'No answer provided.' };
  const result = await getAiClient().completeStructured(
    {
      system:
        'You are a fair grader. Decide whether the student answer is essentially correct ' +
        'compared to the reference answer, then give one short sentence of feedback.',
      prompt: `Question: ${question}\nReference answer: ${referenceAnswer}\nStudent answer: ${userAnswer}`,
      useCase: 'grading',
    },
    ShortAnswerJudgmentSchema,
  );
  return result.data;
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
