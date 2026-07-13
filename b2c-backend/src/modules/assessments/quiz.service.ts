import { Types } from 'mongoose';
import { Quiz } from './quiz.model';
import { QuizSubmission } from './quizSubmission.model';
import { AppError } from '../../common/errors/AppError';
import { getAiClient } from '../ai-guidance/ai.client';
import { QUIZ_SYSTEM_PROMPT, buildQuizPrompt } from '../ai-guidance/prompts';
import { resolveOwnedLesson } from '../lessons/lesson.service';
import {
  GeneratedAssessmentSchema,
  type GeneratedAssessment,
  type GeneratedQuestion,
  type SubmittedAnswer,
} from './assessment.schema';
import { gradeSubmission, type ShortAnswerJudge } from './grading.service';

export type QuizGenerator = (input: {
  lessonTitle: string;
  lessonSummary: string;
  userId: string;
}) => Promise<GeneratedAssessment>;

function summaryOf(content: unknown, fallback: string): string {
  if (content && typeof content === 'object' && 'summary' in content) {
    const s = (content as { summary?: unknown }).summary;
    if (typeof s === 'string') return s;
  }
  return fallback;
}

const defaultQuizGenerator: QuizGenerator = async ({ lessonTitle, lessonSummary, userId }) => {
  const result = await getAiClient().completeStructured(
    {
      system: QUIZ_SYSTEM_PROMPT,
      prompt: buildQuizPrompt({ lessonTitle, lessonSummary }),
      useCase: 'quiz',
      userId,
    },
    GeneratedAssessmentSchema,
  );
  return result.data;
};

// Generates a NEW quiz for a lesson (each call is a fresh variant — §1.7 regeneration).
export async function generateQuiz(
  userId: string,
  lessonId: string,
  generate: QuizGenerator = defaultQuizGenerator,
) {
  const { lesson } = await resolveOwnedLesson(userId, lessonId); // ownership BEFORE any AI call
  const title = lesson.title as string;
  const generated = await generate({
    lessonTitle: title,
    lessonSummary: summaryOf(lesson.content, title),
    userId,
  });
  return Quiz.create({ lessonId: lesson._id, userId, questions: generated.questions });
}

export async function getQuiz(userId: string, quizId: string) {
  if (!Types.ObjectId.isValid(quizId)) throw new AppError(404, 'Quiz not found');
  const quiz = await Quiz.findOne({ _id: quizId, userId });
  if (!quiz) throw new AppError(404, 'Quiz not found');
  return quiz;
}

export async function submitQuiz(
  userId: string,
  quizId: string,
  answers: SubmittedAnswer[],
  judge?: ShortAnswerJudge,
) {
  const quiz = await getQuiz(userId, quizId);
  const { score, results } = await gradeSubmission(
    quiz.questions as unknown as GeneratedQuestion[],
    answers,
    judge,
  );
  return QuizSubmission.create({ quizId: quiz._id, userId, answers, results, score });
}
