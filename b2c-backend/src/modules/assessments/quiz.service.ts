import { Types } from 'mongoose';
import { Quiz } from './quiz.model';
import { QuizSubmission } from './quizSubmission.model';
import { Lesson } from '../lessons/lesson.model';
import { AppError } from '../../common/errors/AppError';
import { getAiClient } from '../ai-guidance/ai.client';
import { QUIZ_SYSTEM_PROMPT, buildQuizPrompt } from '../ai-guidance/prompts';
import { resolveOwnedLesson } from '../lessons/lesson.service';
import { lessonContentSummary } from '../lessons/lessonContent';
import { safeAward } from '../gamification/gamification.service';
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

const defaultQuizGenerator: QuizGenerator = async ({ lessonTitle, lessonSummary, userId }) => {
  const result = await getAiClient().completeStructured(
    {
      system: QUIZ_SYSTEM_PROMPT,
      prompt: buildQuizPrompt({ lessonTitle, lessonSummary, questionCount: 10 }),
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
    lessonSummary: lessonContentSummary(lesson.content, title),
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
  const submission = await QuizSubmission.create({ quizId: quiz._id, userId, answers, results, score });
  await safeAward(userId, { assessmentScore: score }); // §3 assessment achievements
  return submission;
}

export async function listMyQuizSubmissions(userId: string) {
  const submissions = await QuizSubmission.find({ userId })
    .sort({ submittedAt: -1 })
    .limit(50)
    .lean();
  if (submissions.length === 0) return [];

  const quizIds = [...new Set(submissions.map((s) => String(s.quizId)))];
  const quizzes = await Quiz.find({ _id: { $in: quizIds }, userId }).lean();
  const quizMap = new Map(quizzes.map((q) => [String(q._id), q]));

  const lessonIds = [...new Set(quizzes.map((q) => String(q.lessonId)))];
  const lessons = await Lesson.find({ _id: { $in: lessonIds } }).lean();
  const lessonMap = new Map(lessons.map((l) => [String(l._id), l]));

  return submissions.map((s) => {
    const quiz = quizMap.get(String(s.quizId));
    const lesson = quiz ? lessonMap.get(String(quiz.lessonId)) : null;
    return {
      id: String(s._id),
      quizId: String(s.quizId),
      lessonId: quiz ? String(quiz.lessonId) : null,
      lessonTitle: (lesson?.title as string | undefined) ?? 'Lesson quiz',
      score: s.score as number,
      submittedAt: s.submittedAt as Date,
      questionCount: Array.isArray(quiz?.questions) ? quiz!.questions.length : 0,
    };
  });
}
