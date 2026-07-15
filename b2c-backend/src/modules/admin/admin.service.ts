import { Types, type Model } from 'mongoose';
import { User } from '../users/user.model';
import { Course } from '../courses/course.model';
import { Module } from '../modules-content/module.model';
import { Lesson } from '../lessons/lesson.model';
import { Quiz } from '../assessments/quiz.model';
import { QuizSubmission } from '../assessments/quizSubmission.model';
import { ExamSubmission } from '../assessments/examSubmission.model';
import { Exercise } from '../exercises/exercise.model';
import { ExerciseSubmission } from '../exercises/submission.model';
import { AiUsage } from '../ai-guidance/aiUsage.model';
import { Achievement } from '../gamification/achievement.model';
import { ContentFlag } from './contentFlag.model';
import { AppError } from '../../common/errors/AppError';
import { courseGenerationQueue } from '../../jobs/queue';
import { generateQuiz, type QuizGenerator } from '../assessments/quiz.service';
import { generateExercise, type ExerciseGenerator } from '../exercises/exercise.service';

export type ContentType = 'course' | 'lesson' | 'exercise' | 'quiz';

// A minimal, uniform view over the content models (we only list/find/count/delete).
type ContentModel = Model<Record<string, unknown>>;

const MODELS: Record<ContentType, ContentModel> = {
  course: Course as unknown as ContentModel,
  lesson: Lesson as unknown as ContentModel,
  exercise: Exercise as unknown as ContentModel,
  quiz: Quiz as unknown as ContentModel,
};

function modelFor(type: string): ContentModel {
  const m = MODELS[type as ContentType];
  if (!m) throw new AppError(400, `Unknown content type '${type}'`);
  return m;
}

async function requireContent(type: string, id: string) {
  const Model = modelFor(type);
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, 'Content not found');
  const doc = await Model.findById(id);
  if (!doc) throw new AppError(404, 'Content not found');
  return doc;
}

// ---- AI cost dashboard (§11) — aggregate + per-user + per-useCase + per-model ----
export async function getCostDashboard() {
  const [totals] = await AiUsage.aggregate([
    {
      $group: {
        _id: null,
        totalCostUsd: { $sum: '$costUsd' },
        totalCalls: { $sum: 1 },
        inputTokens: { $sum: '$inputTokens' },
        outputTokens: { $sum: '$outputTokens' },
      },
    },
  ]);
  const byUseCase = await AiUsage.aggregate([
    { $group: { _id: '$useCase', costUsd: { $sum: '$costUsd' }, calls: { $sum: 1 } } },
    { $sort: { costUsd: -1 } },
  ]);
  const byModel = await AiUsage.aggregate([
    { $group: { _id: '$model', costUsd: { $sum: '$costUsd' }, calls: { $sum: 1 } } },
    { $sort: { costUsd: -1 } },
  ]);
  const topUsers = await AiUsage.aggregate([
    { $match: { userId: { $ne: null } } },
    { $group: { _id: '$userId', costUsd: { $sum: '$costUsd' }, calls: { $sum: 1 } } },
    { $sort: { costUsd: -1 } },
    { $limit: 20 },
  ]);

  return {
    totalCostUsd: totals?.totalCostUsd ?? 0,
    totalCalls: totals?.totalCalls ?? 0,
    inputTokens: totals?.inputTokens ?? 0,
    outputTokens: totals?.outputTokens ?? 0,
    byUseCase: byUseCase.map((u) => ({ useCase: u._id, costUsd: u.costUsd, calls: u.calls })),
    byModel: byModel.map((m) => ({ model: m._id, costUsd: m.costUsd, calls: m.calls })),
    topUsers: topUsers.map((u) => ({ userId: String(u._id), costUsd: u.costUsd, calls: u.calls })),
  };
}

// ---- Platform metrics (§7.3 observability / §15.6 analytics) ----
export async function getPlatformMetrics() {
  const [users, activeUsers, premiumUsers, courseByStatus, quizSubs, examSubs, exerciseSubs, gradedExercises, aiAgg] =
    await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ tier: 'premium', deletedAt: null }),
      Course.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      QuizSubmission.countDocuments({}),
      ExamSubmission.countDocuments({}),
      ExerciseSubmission.countDocuments({}),
      ExerciseSubmission.countDocuments({ status: 'graded' }),
      AiUsage.aggregate([{ $group: { _id: null, cost: { $sum: '$costUsd' }, calls: { $sum: 1 } } }]),
    ]);

  const byStatus: Record<string, number> = {};
  for (const s of courseByStatus) byStatus[s._id] = s.count;
  const finished = (byStatus.ready ?? 0) + (byStatus.completed ?? 0);
  const failed = byStatus.failed ?? 0;
  const terminal = finished + failed; // exclude still-generating from the rate

  return {
    generatedAt: new Date().toISOString(),
    users: { total: users, active: activeUsers, premium: premiumUsers },
    courses: {
      total: courseByStatus.reduce((n, s) => n + s.count, 0),
      byStatus,
      generationSuccessRate: terminal ? finished / terminal : null,
      generationFailureRate: terminal ? failed / terminal : null,
    },
    assessments: { quizSubmissions: quizSubs, examSubmissions: examSubs },
    exercises: {
      submissions: exerciseSubs,
      graded: gradedExercises,
      completionRate: exerciseSubs ? gradedExercises / exerciseSubs : null,
    },
    ai: { totalCostUsd: aiAgg[0]?.cost ?? 0, totalCalls: aiAgg[0]?.calls ?? 0 },
    // Lab executions are ephemeral (no persistence); error rate is emitted at exec time via logs.
    labs: { note: 'ephemeral — exec error rate emitted via logs/metrics at run time' },
  };
}

// ---- Content listing (paginated, across all users) ----
export async function listContent(type: string, opts: { page?: number; limit?: number } = {}) {
  const Model = modelFor(type);
  // Guard against NaN (e.g. ?page=abc) — `?? 1` only catches null/undefined.
  const page = Math.max(1, Number.isFinite(opts.page) ? Number(opts.page) : 1);
  const limit = Math.min(100, Math.max(1, Number.isFinite(opts.limit) ? Number(opts.limit) : 20));
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Model.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Model.countDocuments(),
  ]);
  return { items, total, page, limit };
}

// ---- Flags ----
export async function flagContent(type: string, id: string, reason: string, adminId: string) {
  await requireContent(type, id);
  return ContentFlag.create({ contentType: type, contentId: id, reason, flaggedBy: adminId });
}

export async function listFlags(status?: string) {
  return ContentFlag.find(status ? { status } : {}).sort({ createdAt: -1 });
}

export async function resolveFlag(flagId: string, resolution: 'resolved' | 'dismissed') {
  if (!Types.ObjectId.isValid(flagId)) throw new AppError(404, 'Flag not found');
  const flag = await ContentFlag.findById(flagId);
  if (!flag) throw new AppError(404, 'Flag not found');
  flag.set('status', resolution);
  flag.set('resolvedAt', new Date());
  await flag.save();
  return flag;
}

// ---- Regenerate AI content ----
export interface RegenerateDeps {
  quizGenerator?: QuizGenerator;
  exerciseGenerator?: ExerciseGenerator;
}

export async function regenerateContent(type: string, id: string, deps: RegenerateDeps = {}) {
  const doc = await requireContent(type, id);

  if (type === 'course') {
    // Replace the tree: clear existing modules/lessons, reset, and re-enqueue (§8).
    await Promise.all([
      Module.deleteMany({ courseId: doc._id }),
      Lesson.deleteMany({ courseId: doc._id }),
    ]);
    doc.set('status', 'generating');
    doc.set('moduleOrder', []);
    doc.set('progressPercent', 0);
    await doc.save();
    await courseGenerationQueue().add('generate', { courseId: String(doc._id) });
    return { type, id: String(doc._id), status: 'generating', enqueued: true };
  }

  if (type === 'quiz') {
    const quiz = doc as unknown as { userId: unknown; lessonId: unknown };
    const fresh = await generateQuiz(
      String(quiz.userId),
      String(quiz.lessonId),
      deps.quizGenerator,
    );
    return { type, id: String(fresh._id), regenerated: true };
  }

  if (type === 'exercise') {
    const ex = doc as unknown as { userId: unknown; lessonId: unknown };
    const fresh = await generateExercise(
      String(ex.userId),
      String(ex.lessonId),
      deps.exerciseGenerator,
    );
    return { type, id: String(fresh._id), regenerated: true };
  }

  // Lessons are regenerated as part of their parent course.
  throw new AppError(400, `Cannot regenerate '${type}' directly — regenerate its parent course.`);
}

// ---- Achievement definition management ----
export async function upsertAchievement(input: {
  key: string;
  title: string;
  description?: string;
  icon?: string;
}) {
  await Achievement.updateOne({ key: input.key }, { $set: input }, { upsert: true });
  return Achievement.findOne({ key: input.key });
}
