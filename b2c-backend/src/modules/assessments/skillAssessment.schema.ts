import { z } from 'zod';
import { AppError } from '../../common/errors/AppError';
import { shuffleMcqOptions } from './mcqOptions';

const AiSkillMcqQuestionSchema = z
  .object({
    question: z.string().min(1),
    type: z.enum(['mcq']).optional(),
    options: z.array(z.string().min(1)).min(2),
    correctAnswer: z.string().min(1).optional(),
    answer: z.string().min(1).optional(),
    difficulty: z.string().optional(),
  })
  .transform((q) => ({
    question: q.question.trim(),
    type: 'mcq' as const,
    options: q.options.map((o) => o.trim()).filter(Boolean),
    correctAnswer: (q.correctAnswer ?? q.answer ?? '').trim(),
  }))
  .refine((q) => q.correctAnswer.length > 0, { message: 'Missing correct answer' });

export const SkillMcqQuestionSchema = z.object({
  question: z.string().min(1),
  type: z.literal('mcq'),
  options: z.array(z.string().min(1)).min(2),
  correctAnswer: z.string().min(1),
});

export type SkillMcqQuestion = z.infer<typeof SkillMcqQuestionSchema>;

export type GeneratedSkillAssessment = {
  questions: Array<{
    question: string;
    type: 'mcq';
    options: string[];
    correctAnswer: string;
  }>;
};

export const GeneratedSkillAssessmentSchema = z.object({
  questions: z.array(AiSkillMcqQuestionSchema).min(8),
});

export function normalizeSkillQuestions(
  questions: GeneratedSkillAssessment['questions'],
): SkillMcqQuestion[] {
  const picked = questions.slice(0, 10);
  if (picked.length < 10) {
    throw new AppError(502, `AI returned only ${picked.length} questions; expected 10`);
  }

  return picked.map((q) => {
    const options = [...new Set(q.options)];
    if (options.length < 2) {
      throw new AppError(502, 'AI returned a question with too few options');
    }
    const correctAnswer = q.correctAnswer.trim();
    const { options: shuffledOptions, correctAnswer: resolvedCorrect } = shuffleMcqOptions(
      options,
      correctAnswer,
    );
    return {
      question: q.question,
      type: 'mcq' as const,
      options: shuffledOptions,
      correctAnswer: resolvedCorrect,
    };
  });
}
