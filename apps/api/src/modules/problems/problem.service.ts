import { randomUUID } from 'node:crypto';
import { FREE_PROBLEM_LIMIT, updateSkillStats, type SkillTopicStats } from '@aieng/shared';
import { AppError } from '../../common/errors/AppError';
import { logger } from '../../common/utils/logger';
import type { GeneratedQuestion } from '../assessments/assessment.schema';
import { gradeSubmission } from '../assessments/grading.service';
import { Problem } from './problem.model';
import { ProblemSubmission } from './problemSubmission.model';
import { UserPracticeProgress } from './userPracticeProgress.model';
import { SEED_PROBLEMS } from './problems.seed';
import type { SyncPracticePayload } from './problem.validation';

const normalize = (s: string): string => s.trim().toLowerCase();

export interface ProblemPublic {
  slug: string;
  title: string;
  topic: string;
  difficulty: string;
  type: string;
  prompt: string;
  options: string[] | null;
  order: number;
}

export interface SubmitResult {
  submissionId: string;
  correct: boolean;
  score: number;
  feedback: string;
  correctAnswer: string;
  topic: string;
}

function toPublic(problem: {
  slug: string;
  title: string;
  topic: string;
  difficulty: string;
  type: string;
  prompt: string;
  options?: string[] | null;
  order: number;
}): ProblemPublic {
  return {
    slug: problem.slug,
    title: problem.title,
    topic: problem.topic,
    difficulty: problem.difficulty,
    type: problem.type,
    prompt: problem.prompt,
    options: problem.options ?? null,
    order: problem.order,
  };
}

export async function seedProblems(): Promise<void> {
  for (const item of SEED_PROBLEMS) {
    await Problem.updateOne({ slug: item.slug }, { $set: { ...item, active: true } }, { upsert: true });
  }
  logger.info({ count: SEED_PROBLEMS.length }, 'Problem bank seeded');
}

export async function listProblems(filters: {
  topic?: string;
  difficulty?: string;
}): Promise<{ problems: ProblemPublic[] }> {
  const query: Record<string, unknown> = { active: true };
  if (filters.topic) query.topic = filters.topic;
  if (filters.difficulty) query.difficulty = filters.difficulty;

  const rows = await Problem.find(query).sort({ order: 1 }).lean();
  return { problems: rows.map(toPublic) };
}

export async function getProblemBySlug(slug: string): Promise<ProblemPublic> {
  const problem = await Problem.findOne({ slug, active: true }).lean();
  if (!problem) throw new AppError(404, 'Problem not found');
  return toPublic(problem);
}

export async function getNextProblem(excludeSlugs: string[]): Promise<{ problem: ProblemPublic | null }> {
  const exclude = new Set(excludeSlugs);
  const rows = await Problem.find({ active: true }).sort({ order: 1 }).lean();
  const next = rows.find((p) => !exclude.has(p.slug));
  return { problem: next ? toPublic(next) : null };
}

async function gradeMcq(problem: {
  prompt: string;
  type: string;
  options?: string[] | null;
  correctAnswer: string;
}, answer: string) {
  const question: GeneratedQuestion = {
    question: problem.prompt,
    type: problem.type === 'short_answer' ? 'short_answer' : 'mcq',
    options: problem.options ?? null,
    correctAnswer: problem.correctAnswer,
  };
  const { score, results } = await gradeSubmission([question], [{ questionIndex: 0, answer }]);
  const result = results[0];
  return {
    correct: result.correct,
    score,
    feedback: result.feedback,
    correctAnswer: result.correctAnswer,
  };
}

export async function submitProblem(
  slug: string,
  body: {
    guestSessionId: string;
    answer: string;
    completedCount?: number;
    clientSubmissionId?: string;
  },
  userId?: string,
): Promise<SubmitResult> {
  const problem = await Problem.findOne({ slug, active: true });
  if (!problem) throw new AppError(404, 'Problem not found');

  if (!userId) {
    const completed = body.completedCount ?? 0;
    const alreadyDone = false; // guest re-submit allowed for same slug in MVP
    if (!alreadyDone && completed >= FREE_PROBLEM_LIMIT) {
      throw new AppError(403, 'Login required to continue practicing', { code: 'LOGIN_REQUIRED' });
    }
  }

  const graded = await gradeMcq(problem, body.answer);
  const submissionId = body.clientSubmissionId ?? randomUUID();

  if (userId) {
    await ProblemSubmission.findOneAndUpdate(
      { userId, problemSlug: slug },
      {
        $set: {
          guestSessionId: body.guestSessionId,
          clientSubmissionId: submissionId,
          topic: problem.topic,
          difficulty: problem.difficulty,
          type: problem.type,
          answer: body.answer,
          score: graded.score,
          correct: graded.correct,
          feedback: graded.feedback,
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    const progress = await UserPracticeProgress.findOne({ userId }).lean();
    const completedSlugs = new Set(progress?.completedSlugs ?? []);
    completedSlugs.add(slug);
    const skillByTopic = { ...(progress?.skillByTopic as Record<string, SkillTopicStats> | undefined) };
    skillByTopic[problem.topic] = updateSkillStats(skillByTopic[problem.topic], graded.score, graded.correct);

    await UserPracticeProgress.findOneAndUpdate(
      { userId },
      {
        $set: {
          completedSlugs: [...completedSlugs],
          skillByTopic,
          totalCompleted: completedSlugs.size,
          lastProblemSlug: slug,
          guestSessionId: body.guestSessionId,
        },
      },
      { upsert: true },
    );
  }

  return {
    submissionId,
    correct: graded.correct,
    score: graded.score,
    feedback: graded.feedback,
    correctAnswer: graded.correctAnswer,
    topic: problem.topic,
  };
}

export async function syncGuestPractice(userId: string, payload: SyncPracticePayload) {
  let merged = 0;
  for (const sub of payload.submissions) {
    const existing = await ProblemSubmission.findOne({ userId, problemSlug: sub.problemSlug });
    if (existing) continue;

    await ProblemSubmission.create({
      userId,
      guestSessionId: payload.guestSessionId,
      clientSubmissionId: sub.clientSubmissionId,
      problemSlug: sub.problemSlug,
      topic: sub.topic,
      difficulty: sub.difficulty,
      type: sub.type,
      answer: sub.answer,
      score: sub.score,
      correct: sub.correct,
      feedback: sub.feedback,
      submittedAt: new Date(sub.submittedAt),
    });
    merged += 1;
  }

  const progress = await UserPracticeProgress.findOne({ userId }).lean();
  const completedSlugs = new Set([...(progress?.completedSlugs ?? []), ...payload.completedSlugs]);
  const skillByTopic = {
    ...(progress?.skillByTopic as Record<string, SkillTopicStats> | undefined),
  };

  for (const [topic, stats] of Object.entries(payload.skillByTopic)) {
    const prev = skillByTopic[topic];
    if (!prev) {
      skillByTopic[topic] = stats;
      continue;
    }
    const combinedAttempted = prev.attempted + stats.attempted;
    const combinedPassed = prev.passed + stats.passed;
    const avgScore = Math.round(
      (prev.avgScore * prev.attempted + stats.avgScore * stats.attempted) /
        Math.max(combinedAttempted, 1),
    );
    skillByTopic[topic] = {
      attempted: combinedAttempted,
      passed: combinedPassed,
      avgScore,
      level: stats.level,
    };
  }

  await UserPracticeProgress.findOneAndUpdate(
    { userId },
    {
      $set: {
        completedSlugs: [...completedSlugs],
        skillByTopic,
        totalCompleted: completedSlugs.size,
        lastProblemSlug: payload.lastProblemSlug ?? progress?.lastProblemSlug,
        guestSessionId: payload.guestSessionId,
        lastSyncedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return { merged, totalCompleted: completedSlugs.size };
}

export function gradeMcqDirect(
  correctAnswer: string,
  userAnswer: string,
): { correct: boolean; score: number; feedback: string } {
  const correct = normalize(userAnswer) === normalize(correctAnswer);
  return {
    correct,
    score: correct ? 100 : 0,
    feedback: correct ? 'Correct.' : 'Incorrect.',
  };
}
