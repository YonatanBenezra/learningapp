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
import { Subscription } from '../subscriptions/subscription.model';
import { SkillAssessment } from '../assessments/skillAssessment.model';
import { SkillAssessmentSubmission } from '../assessments/skillAssessmentSubmission.model';
import { CourseEnrollment } from '../instructor/courseEnrollment.model';
import { UserLessonProgress } from '../progress/progress.model';
import { Notification } from '../notifications/notification.model';
import { AppError } from '../../common/errors/AppError';
import type { Role } from '../../common/types';
import { courseGenerationQueue, skillAssessmentGenerationQueue } from '../../jobs/queue';
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

export async function setUserRole(userId: string, role: Role) {
  const user = await User.findByIdAndUpdate(userId, { $set: { role } }, { new: true });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

function paginate(page?: number, limit?: number) {
  const safePage = Math.max(1, Number.isFinite(page) ? Number(page) : 1);
  const safeLimit = Math.min(100, Math.max(1, Number.isFinite(limit) ? Number(limit) : 20));
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

export async function listUsers(
  opts: { page?: number; limit?: number; search?: string; role?: Role; tier?: string } = {},
) {
  const { page, limit, skip } = paginate(opts.page, opts.limit);
  const filter: Record<string, unknown> = {};
  if (opts.role) filter.role = opts.role;
  if (opts.tier) filter.tier = opts.tier;
  if (opts.search?.trim()) {
    const q = opts.search.trim();
    filter.$or = [
      { email: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getSubscriptionDashboard() {
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [byTier, byStatus, subscriptionRecords, trialsExpiringSoon, paidActive] = await Promise.all([
    User.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$tier', count: { $sum: 1 } } },
    ]),
    Subscription.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Subscription.countDocuments({}),
    Subscription.countDocuments({
      trialEndsAt: { $gte: now, $lte: inSevenDays },
      tier: 'free',
    }),
    Subscription.countDocuments({
      tier: { $in: ['standard', 'premium'] },
      status: 'active',
    }),
  ]);

  const tierCounts: Record<string, number> = {};
  for (const row of byTier) tierCounts[row._id] = row.count;

  const statusCounts: Record<string, number> = {};
  for (const row of byStatus) statusCounts[row._id] = row.count;

  return {
    usersByTier: {
      free: tierCounts.free ?? 0,
      standard: tierCounts.standard ?? 0,
      premium: tierCounts.premium ?? 0,
    },
    subscriptionsByStatus: statusCounts,
    totalSubscriptionRecords: subscriptionRecords,
    paidActiveSubscriptions: paidActive,
    trialsExpiringSoon,
  };
}

export async function getAssessmentDashboard() {
  const [total, byStatus, byTopic, submissions, byLevel] = await Promise.all([
    SkillAssessment.countDocuments({}),
    SkillAssessment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    SkillAssessment.aggregate([
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    SkillAssessmentSubmission.countDocuments({}),
    SkillAssessmentSubmission.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of byStatus) statusCounts[row._id] = row.count;

  return {
    totalAssessments: total,
    byStatus: statusCounts,
    byTopic: byTopic.map((row) => ({ topic: row._id, count: row.count })),
    completedSubmissions: submissions,
    byLevel: byLevel.map((row) => ({ level: row._id, count: row.count })),
  };
}

function displayCreatorName(name?: string | null, email?: string | null) {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  if (email) return email.split('@')[0] ?? email;
  return 'Unknown creator';
}

const MARKETPLACE_COURSE_SELECT =
  'title description category level status kind enrollmentCount revenueCents priceCents currency isPublished userId createdAt updatedAt';

type MarketplaceCourseDoc = Record<string, unknown> & {
  _id?: unknown;
  userId?: unknown;
};

async function mapMarketplaceCourseSummaries(courses: MarketplaceCourseDoc[]) {
  const creatorIds = [...new Set(courses.map((course) => String(course.userId)))];
  const creators = creatorIds.length
    ? await User.find({ _id: { $in: creatorIds } })
        .select('email name')
        .lean()
    : [];
  const creatorById = new Map(
    creators.map((user) => [
      String(user._id),
      {
        email: (user.email as string) ?? '',
        name: displayCreatorName(user.name as string | undefined, user.email as string | undefined),
      },
    ]),
  );

  return courses.map((course) => {
    const creator = creatorById.get(String(course.userId));
    return {
      id: String(course._id),
      title: course.title as string,
      description: (course.description as string) ?? '',
      category: course.category as string,
      level: course.level as string,
      status: course.status as string,
      enrollmentCount: (course.enrollmentCount as number) ?? 0,
      revenueCents: (course.revenueCents as number) ?? 0,
      priceCents: (course.priceCents as number) ?? 0,
      currency: (course.currency as string) ?? 'USD',
      isPublished: (course.isPublished as boolean) ?? false,
      creatorId: String(course.userId),
      creatorName: creator?.name ?? 'Unknown creator',
      creatorEmail: creator?.email ?? '',
      kind: (course.kind as 'personal' | 'marketplace') ?? 'personal',
      createdAt: course.createdAt,
    };
  });
}

export async function getMarketplaceDashboard() {
  const [
    publishedCourses,
    totalCourses,
    marketplaceCourses,
    totalEnrollments,
    revenueAgg,
    coursesRaw,
    failedCourses,
    generatingCourses,
    instructors,
  ] = await Promise.all([
    Course.countDocuments({ kind: 'marketplace', isPublished: true }),
    Course.countDocuments({}),
    Course.countDocuments({ kind: 'marketplace' }),
    CourseEnrollment.countDocuments({ status: 'completed' }),
    CourseEnrollment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalCents: { $sum: '$amountCents' } } },
    ]),
    Course.find({})
      .sort({ updatedAt: -1 })
      .limit(500)
      .select(MARKETPLACE_COURSE_SELECT)
      .lean(),
    Course.countDocuments({ status: 'failed' }),
    Course.countDocuments({ status: 'generating' }),
    User.countDocuments({ role: 'instructor', deletedAt: null }),
  ]);

  const courses = await mapMarketplaceCourseSummaries(coursesRaw);

  return {
    publishedCourses,
    totalCourses,
    marketplaceCourses,
    totalEnrollments,
    totalRevenueCents: revenueAgg[0]?.totalCents ?? 0,
    instructors,
    failedCourses,
    generatingCourses,
    courses,
  };
}

export async function getMarketplaceCourseDetail(courseId: string) {
  const doc = await Course.findById(courseId).lean();
  if (!doc) throw new AppError(404, 'Course not found');

  const [lessonCount, moduleCount, instructor, modules, enrollmentStats, recentSales] =
    await Promise.all([
      Lesson.countDocuments({ courseId: doc._id }),
      Module.countDocuments({ courseId: doc._id }),
      User.findById(doc.userId).select('email name role').lean(),
      Module.find({ courseId: doc._id }).sort({ order: 1 }).lean(),
      CourseEnrollment.aggregate<{ _id: null; count: number; revenueCents: number }>([
        { $match: { courseId: doc._id, status: 'completed' } },
        { $group: { _id: null, count: { $sum: 1 }, revenueCents: { $sum: '$amountCents' } } },
      ]),
      CourseEnrollment.find({ courseId: doc._id, status: 'completed' })
        .sort({ purchasedAt: -1 })
        .limit(8)
        .select('studentEmail amountCents currency purchasedAt')
        .lean(),
    ]);

  const moduleIds = modules.map((moduleDoc) => moduleDoc._id);
  const lessons =
    moduleIds.length > 0
      ? await Lesson.find({ moduleId: { $in: moduleIds } })
          .sort({ order: 1 })
          .select('moduleId title order')
          .lean()
      : [];

  const lessonsByModule = new Map<string, { id: string; title: string; order: number }[]>();
  for (const lesson of lessons) {
    const key = String(lesson.moduleId);
    const bucket = lessonsByModule.get(key) ?? [];
    bucket.push({
      id: String(lesson._id),
      title: lesson.title as string,
      order: lesson.order as number,
    });
    lessonsByModule.set(key, bucket);
  }

  const stats = enrollmentStats[0];

  return {
    course: {
      id: String(doc._id),
      title: doc.title as string,
      description: (doc.description as string) ?? '',
      category: doc.category as string,
      level: doc.level as string,
      topics: (doc.topics as string[]) ?? [],
      status: doc.status as string,
      kind: (doc.kind as 'personal' | 'marketplace') ?? 'personal',
      isPublished: (doc.isPublished as boolean) ?? false,
      priceCents: (doc.priceCents as number) ?? 0,
      currency: (doc.currency as string) ?? 'USD',
      slug: (doc.slug as string) ?? null,
      enrollmentCount: (doc.enrollmentCount as number) ?? 0,
      revenueCents: (doc.revenueCents as number) ?? 0,
      lessonCount,
      moduleCount,
      failureReason: (doc.failureReason as string) ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      generatedAt: doc.generatedAt ?? null,
      creator: {
        id: String(doc.userId),
        name: displayCreatorName(
          instructor?.name as string | undefined,
          instructor?.email as string | undefined,
        ),
        email: (instructor?.email as string) ?? '',
        role: (instructor?.role as string) ?? 'instructor',
      },
    },
    modules: modules.map((moduleDoc) => ({
      id: String(moduleDoc._id),
      title: moduleDoc.title as string,
      domain: moduleDoc.domain as string,
      order: moduleDoc.order as number,
      lessons: lessonsByModule.get(String(moduleDoc._id)) ?? [],
    })),
    stats: {
      completedEnrollments: stats?.count ?? 0,
      recordedRevenueCents: stats?.revenueCents ?? 0,
    },
    recentSales: recentSales.map((sale) => ({
      studentEmail: sale.studentEmail as string,
      amountCents: sale.amountCents as number,
      currency: (sale.currency as string) ?? 'USD',
      purchasedAt: sale.purchasedAt as Date,
    })),
  };
}

async function queueCounts(name: 'course' | 'skill') {
  try {
    const queue =
      name === 'course' ? courseGenerationQueue() : skillAssessmentGenerationQueue();
    return queue.getJobCounts('waiting', 'active', 'failed', 'delayed');
  } catch {
    return { waiting: 0, active: 0, failed: 0, delayed: 0, unavailable: true as const };
  }
}

export async function getSystemDashboard() {
  const [
    openFlags,
    failedCourses,
    failedMarketplaceCourses,
    failedPersonalCourses,
    generatingCourses,
    generatingMarketplaceCourses,
    failedAssessments,
    courseQueue,
    skillQueue,
  ] = await Promise.all([
    ContentFlag.countDocuments({ status: 'open' }),
    Course.countDocuments({ status: 'failed' }),
    Course.countDocuments({ kind: 'marketplace', status: 'failed' }),
    Course.countDocuments({ kind: 'personal', status: 'failed' }),
    Course.countDocuments({ status: 'generating' }),
    Course.countDocuments({ kind: 'marketplace', status: 'generating' }),
    SkillAssessment.countDocuments({ status: 'failed' }),
    queueCounts('course'),
    queueCounts('skill'),
  ]);

  return {
    openFlags,
    failedCourses,
    failedMarketplaceCourses,
    failedPersonalCourses,
    generatingCourses,
    generatingMarketplaceCourses,
    failedAssessments,
    queues: {
      courseGeneration: courseQueue,
      skillAssessmentGeneration: skillQueue,
    },
    labsNote: 'Lab executions are ephemeral — error rates are emitted via logs at run time.',
  };
}

export async function getActivityDashboard() {
  const now = new Date();
  const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const days14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const dailyGroup = {
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      count: { $sum: 1 },
    },
  };

  const [
    signups7d,
    signups30d,
    activeUsers,
    lessonCompletions,
    quizSubs7d,
    examSubs7d,
    exerciseSubs7d,
    totalQuizSubmissions,
    totalExamSubmissions,
    totalExerciseSubmissions,
    signupsByDay,
    quizByDay,
    examByDay,
    exerciseByDay,
  ] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: days7 }, deletedAt: null }),
    User.countDocuments({ createdAt: { $gte: days30 }, deletedAt: null }),
    User.countDocuments({ deletedAt: null }),
    UserLessonProgress.countDocuments({ status: 'completed' }),
    QuizSubmission.countDocuments({ createdAt: { $gte: days7 } }),
    ExamSubmission.countDocuments({ createdAt: { $gte: days7 } }),
    ExerciseSubmission.countDocuments({ createdAt: { $gte: days7 } }),
    QuizSubmission.countDocuments({}),
    ExamSubmission.countDocuments({}),
    ExerciseSubmission.countDocuments({}),
    User.aggregate([
      { $match: { createdAt: { $gte: days14 }, deletedAt: null } },
      dailyGroup,
      { $sort: { _id: 1 } },
    ]),
    QuizSubmission.aggregate([
      { $match: { createdAt: { $gte: days14 } } },
      dailyGroup,
      { $sort: { _id: 1 } },
    ]),
    ExamSubmission.aggregate([
      { $match: { createdAt: { $gte: days14 } } },
      dailyGroup,
      { $sort: { _id: 1 } },
    ]),
    ExerciseSubmission.aggregate([
      { $match: { createdAt: { $gte: days14 } } },
      dailyGroup,
      { $sort: { _id: 1 } },
    ]),
  ]);

  const learningMap = new Map<string, { quiz: number; exam: number; exercises: number }>();
  for (const row of quizByDay) {
    const entry = learningMap.get(row._id) ?? { quiz: 0, exam: 0, exercises: 0 };
    entry.quiz = row.count;
    learningMap.set(row._id, entry);
  }
  for (const row of examByDay) {
    const entry = learningMap.get(row._id) ?? { quiz: 0, exam: 0, exercises: 0 };
    entry.exam = row.count;
    learningMap.set(row._id, entry);
  }
  for (const row of exerciseByDay) {
    const entry = learningMap.get(row._id) ?? { quiz: 0, exam: 0, exercises: 0 };
    entry.exercises = row.count;
    learningMap.set(row._id, entry);
  }

  const learningActivityByDay = [...learningMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      quiz: counts.quiz,
      exam: counts.exam,
      exercises: counts.exercises,
      total: counts.quiz + counts.exam + counts.exercises,
    }));

  const signups14dTotal = signupsByDay.reduce((sum, row) => sum + row.count, 0);
  const peakSignupDay = signupsByDay.reduce<{ date: string | null; count: number }>(
    (best, row) => (row.count > best.count ? { date: row._id, count: row.count } : best),
    { date: null, count: 0 },
  );

  return {
    generatedAt: now.toISOString(),
    signups7d,
    signups30d,
    activeUsers,
    lessonCompletions,
    quizSubmissions7d: quizSubs7d,
    examSubmissions7d: examSubs7d,
    exerciseSubmissions7d: exerciseSubs7d,
    learningEvents7d: quizSubs7d + examSubs7d + exerciseSubs7d,
    totalQuizSubmissions,
    totalExamSubmissions,
    totalExerciseSubmissions,
    signups14dTotal,
    avgDailySignups7d: signups7d ? signups7d / 7 : 0,
    peakSignupDay: peakSignupDay.date,
    peakSignupCount: peakSignupDay.count,
    signupsByDay: signupsByDay.map((row) => ({ date: row._id, count: row.count })),
    learningActivityByDay,
  };
}

export async function listAchievements() {
  return Achievement.find().sort({ createdAt: -1 });
}

export async function listAdminNotifications(opts: { page?: number; limit?: number } = {}) {
  const { page, limit, skip } = paginate(opts.page, opts.limit);
  const [items, total, byType] = await Promise.all([
    Notification.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({}),
    Notification.aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]),
  ]);

  return {
    items,
    total,
    page,
    limit,
    byType: byType.map((row) => ({
      type: row._id,
      total: row.total,
      sent: row.sent,
      failed: row.failed,
    })),
  };
}

export async function broadcastNotification(input: { title: string; body: string }) {
  const users = await User.find({ deletedAt: null }).select('_id');
  const now = new Date();
  if (!users.length) return { recipients: 0 };

  await Notification.insertMany(
    users.map((user) => ({
      userId: user._id,
      type: 'admin-broadcast',
      channel: 'email',
      status: 'sent',
      sentAt: now,
      payload: { subject: input.title, body: input.body },
    })),
  );

  return { recipients: users.length };
}
