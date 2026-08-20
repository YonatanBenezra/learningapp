import { z } from 'zod';

function normalizeQuestionType(type: unknown): 'mcq' | 'short_answer' {
  const raw = String(type ?? 'mcq')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (
    raw === 'short_answer' ||
    raw === 'shortanswer' ||
    raw === 'text' ||
    raw === 'open' ||
    raw === 'free_text'
  ) {
    return 'short_answer';
  }
  return 'mcq';
}

const AiQuestionSchema = z
  .object({
    question: z.string().min(1),
    type: z.string().optional(),
    options: z.array(z.string()).nullable().optional(),
    correctAnswer: z.string().min(1).optional(),
    answer: z.string().min(1).optional(),
  })
  .passthrough()
  .transform((q) => {
    const type = normalizeQuestionType(q.type);
    const correctAnswer = (q.correctAnswer ?? q.answer ?? '').trim();
    const options =
      type === 'mcq'
        ? (q.options ?? []).map((o) => o.trim()).filter(Boolean)
        : q.options ?? null;
    return {
      question: q.question.trim(),
      type,
      options: type === 'mcq' ? options : options ?? null,
      correctAnswer,
    };
  })
  .pipe(
    z.object({
      question: z.string().min(1),
      type: z.enum(['mcq', 'short_answer']),
      options: z.array(z.string()).nullable().optional(),
      correctAnswer: z.string().min(1),
    }),
  );

// Shape the AI must return for a quiz or exam (validated by AiClient).
export const QuestionSchema = z.object({
  question: z.string().min(1),
  type: z.enum(['mcq', 'short_answer']),
  options: z.array(z.string()).nullable().optional(),
  correctAnswer: z.string().min(1),
});

export const GeneratedAssessmentSchema = z
  .object({
    questions: z.array(AiQuestionSchema).min(1).optional(),
    assessment: z
      .object({
        questions: z.array(AiQuestionSchema).min(1).optional(),
      })
      .passthrough()
      .optional(),
    exam: z
      .object({
        questions: z.array(AiQuestionSchema).min(1).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()
  .transform((data) => {
    const questions =
      data.questions ?? data.assessment?.questions ?? data.exam?.questions ?? [];
    return { questions };
  })
  .pipe(
    z.object({
      questions: z.array(QuestionSchema).min(1),
    }),
  );

export type GeneratedQuestion = z.infer<typeof QuestionSchema>;
export type GeneratedAssessment = z.infer<typeof GeneratedAssessmentSchema>;

export interface SubmittedAnswer {
  questionIndex: number;
  answer: string;
}

export interface GradedResult {
  questionIndex: number;
  correct: boolean;
  correctAnswer: string;
  feedback: string;
}
