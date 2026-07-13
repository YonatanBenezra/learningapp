import { z } from 'zod';

// Shape the AI must return for a quiz or exam (validated by AiClient).
export const QuestionSchema = z.object({
  question: z.string().min(1),
  type: z.enum(['mcq', 'short_answer']),
  options: z.array(z.string()).nullable().optional(),
  correctAnswer: z.string().min(1),
});

export const GeneratedAssessmentSchema = z.object({
  questions: z.array(QuestionSchema).min(1),
});

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
