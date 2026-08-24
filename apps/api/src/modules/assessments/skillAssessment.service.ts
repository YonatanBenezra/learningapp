import { Types } from 'mongoose';
import { SkillAssessment } from './skillAssessment.model';
import { SkillAssessmentSubmission } from './skillAssessmentSubmission.model';
import { AppError } from '../../common/errors/AppError';
import { getAiClient } from '../ai-guidance/ai.client';
import {
  SKILL_ASSESSMENT_SYSTEM_PROMPT,
  buildSkillAssessmentPrompt,
} from '../ai-guidance/prompts/skillAssessment.prompts';
import { User } from '../users/user.model';
import { safeAward } from '../gamification/gamification.service';
import {
  GeneratedSkillAssessmentSchema,
  normalizeSkillQuestions,
  type GeneratedSkillAssessment,
  type SkillMcqQuestion,
} from './skillAssessment.schema';
import type { ZodType } from 'zod';
import { scoreToLevel, skillAssessmentLimitFor } from './skillAssessment.constants';
import { gradeSubmission, type ShortAnswerJudge } from './grading.service';
import type { SubmittedAnswer } from './assessment.schema';
import { assertPlatformAccess } from '../subscriptions/subscription.service';
import { skillAssessmentGenerationQueue, jobPriority } from '../../jobs/queue';
import { logger } from '../../common/utils/logger';
import { buildDiagnosticQuestions } from './diagnosticAssessment.seed';

export type SkillAssessmentStatus = 'generating' | 'ready' | 'failed';

export function resolveAssessmentStatus(assessment: {
  status?: SkillAssessmentStatus | null;
  questions?: unknown[];
}): SkillAssessmentStatus {
  if (assessment.status) return assessment.status;
  return Array.isArray(assessment.questions) && assessment.questions.length > 0
    ? 'ready'
    : 'generating';
}

export type SkillAssessmentGenerator = (input: {
  topicLabel: string;
  userId?: string;
  aiModel?: string | null;
}) => Promise<GeneratedSkillAssessment>;

const defaultGenerator: SkillAssessmentGenerator = async ({ topicLabel, userId, aiModel }) => {
  const result = await getAiClient().completeStructured(
    {
      system: SKILL_ASSESSMENT_SYSTEM_PROMPT,
      prompt: buildSkillAssessmentPrompt({ topic: topicLabel, questionCount: 10 }),
      useCase: 'quiz',
      userId,
      model: aiModel ?? undefined,
    },
    GeneratedSkillAssessmentSchema as ZodType<GeneratedSkillAssessment>,
  );
  return result.data;
};

function topicLabel(topic: string, customTopic?: string | null): string {
  return topic === 'Other' && customTopic ? customTopic.trim() : topic;
}

function activeAssessmentFilter(now = new Date()) {
  return { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] };
}

/** Attach guest-session assessments to the authenticated user (same browser). */
export async function claimGuestAssessments(
  userId: string,
  guestSessionId?: string | null,
): Promise<number> {
  if (!guestSessionId?.trim()) return 0;
  const userObjectId = new Types.ObjectId(userId);
  const result = await SkillAssessment.updateMany(
    { guestSessionId: guestSessionId.trim(), userId: null },
    { $set: { userId: userObjectId } },
  );
  await SkillAssessmentSubmission.updateMany(
    { guestSessionId: guestSessionId.trim(), userId: null },
    { $set: { userId: userObjectId }, $unset: { guestSessionId: 1 } },
  );
  return result.modifiedCount;
}

type AssessmentAccess = {
  userId?: string;
  guestSessionId?: string;
};

function assertAssessmentAccess(
  assessment: { userId?: unknown; guestSessionId?: string | null },
  access: AssessmentAccess,
) {
  if (access.userId) {
    if (assessment.userId) {
      if (String(assessment.userId) !== access.userId) {
        throw new AppError(403, 'Assessment not found');
      }
      return;
    }
    if (!access.guestSessionId || assessment.guestSessionId !== access.guestSessionId) {
      throw new AppError(403, 'Assessment not found');
    }
    return;
  }

  if (!access.guestSessionId) {
    throw new AppError(401, 'Authentication required');
  }
  if (assessment.userId || assessment.guestSessionId !== access.guestSessionId) {
    throw new AppError(403, 'Assessment not found');
  }
}

async function countSkillAssessments(userId?: string, guestSessionId?: string): Promise<number> {
  const active = activeAssessmentFilter();
  if (userId) {
    return SkillAssessment.countDocuments({ ...active, userId: new Types.ObjectId(userId) });
  }
  if (guestSessionId) {
    return SkillAssessment.countDocuments({ ...active, guestSessionId, userId: null });
  }
  return 0;
}

export async function assertSkillAssessmentQuota(
  userId?: string,
  guestSessionId?: string,
  tier?: string | null,
): Promise<void> {
  const limit = skillAssessmentLimitFor(tier);
  if (!Number.isFinite(limit)) return;
  const used = await countSkillAssessments(userId, guestSessionId);
  if (used >= limit) {
    throw new AppError(429, `Your plan allows up to ${limit} active assessments.`);
  }
}

export async function listSkillAssessments(
  userId?: string,
  guestSessionId?: string,
  tier?: string | null,
) {
  const limit = skillAssessmentLimitFor(tier);

  if (!userId && !guestSessionId) {
    return {
      assessments: [],
      quota: {
        tier: tier ?? 'free',
        limit: Number.isFinite(limit) ? limit : null,
        used: 0,
        remaining: Number.isFinite(limit) ? limit : null,
      },
    };
  }

  if (userId) {
    await claimGuestAssessments(userId, guestSessionId);
  }

  const used = await countSkillAssessments(userId, guestSessionId);
  const submissionByAssessment = new Map<
    string,
    { score: number; level: string; submittedAt: Date }
  >();

  if (userId) {
    const userObjectId = new Types.ObjectId(userId);
    const subs = await SkillAssessmentSubmission.find({ userId: userObjectId })
      .select('assessmentId score level submittedAt')
      .lean();
    for (const sub of subs) {
      submissionByAssessment.set(String(sub.assessmentId), {
        score: sub.score,
        level: sub.level,
        submittedAt: sub.submittedAt,
      });
    }
  } else if (guestSessionId) {
    const subs = await SkillAssessmentSubmission.find({ guestSessionId, userId: null })
      .select('assessmentId score level submittedAt')
      .lean();
    for (const sub of subs) {
      submissionByAssessment.set(String(sub.assessmentId), {
        score: sub.score,
        level: sub.level,
        submittedAt: sub.submittedAt,
      });
    }
  }

  const filter = userId
    ? { userId: new Types.ObjectId(userId), ...activeAssessmentFilter() }
    : { guestSessionId, userId: null, ...activeAssessmentFilter() };

  const docs = await SkillAssessment.find(filter)
    .sort({ createdAt: -1 })
    .select('topic customTopic generatedAt expiresAt questions status failureReason')
    .lean();

  const assessments = docs.map((doc) => {
    const id = String(doc._id);
    const submission = submissionByAssessment.get(id);
    const generationStatus = resolveAssessmentStatus(doc);
    return {
      id,
      topic: doc.topic,
      customTopic: doc.customTopic ?? null,
      topicLabel: topicLabel(doc.topic, doc.customTopic),
      questionCount: Array.isArray(doc.questions) ? doc.questions.length : 0,
      generatedAt: doc.generatedAt,
      expiresAt: doc.expiresAt,
      generationStatus,
      failureReason: doc.failureReason ?? null,
      status: submission ? ('completed' as const) : ('pending' as const),
      submission,
    };
  });

  return {
    assessments,
    quota: {
      tier: tier ?? 'free',
      limit: Number.isFinite(limit) ? limit : null,
      used,
      remaining: Number.isFinite(limit) ? Math.max(0, limit - used) : null,
    },
  };
}

export async function generateSkillAssessment(
  input: { topic: string; customTopic?: string; guestSessionId?: string; aiModel?: string | null },
  userId?: string,
  tier?: string | null,
  generate?: SkillAssessmentGenerator,
) {
  if (userId) await assertPlatformAccess(userId);
  await assertSkillAssessmentQuota(userId, input.guestSessionId, tier);

  const assessment = await SkillAssessment.create({
    topic: input.topic,
    customTopic: input.customTopic ?? null,
    userId: userId ? new Types.ObjectId(userId) : null,
    guestSessionId: input.guestSessionId ?? null,
    aiModel: input.aiModel?.trim() || null,
    questions: [],
    status: 'generating',
  });

  const assessmentId = String(assessment._id);

  if (generate) {
    await runSkillAssessmentGeneration(assessmentId, generate);
    return SkillAssessment.findById(assessmentId);
  }

  await skillAssessmentGenerationQueue().add(
    'generate',
    { assessmentId },
    { priority: jobPriority(tier ?? undefined) },
  );

  return assessment;
}

/** Instant diagnostic assessment with curated MCQs (MVP practice gate). */
export async function startDiagnosticAssessment(
  input: { topic: string; customTopic?: string; guestSessionId?: string },
  userId?: string,
  tier?: string | null,
) {
  if (userId) await assertPlatformAccess(userId);
  await assertSkillAssessmentQuota(userId, input.guestSessionId, tier);

  const questions = buildDiagnosticQuestions();
  const assessment = await SkillAssessment.create({
    topic: input.topic,
    customTopic: input.customTopic ?? null,
    userId: userId ? new Types.ObjectId(userId) : null,
    guestSessionId: input.guestSessionId ?? null,
    aiModel: null,
    questions,
    status: 'ready',
    generatedAt: new Date(),
    failureReason: null,
  });

  return assessment;
}

export async function runSkillAssessmentGeneration(
  assessmentId: string,
  generate: SkillAssessmentGenerator = defaultGenerator,
): Promise<void> {
  const assessment = await SkillAssessment.findById(assessmentId);
  if (!assessment || resolveAssessmentStatus(assessment) !== 'generating') return;

  try {
    const label = topicLabel(assessment.topic, assessment.customTopic);
    const userId = assessment.userId ? String(assessment.userId) : undefined;
    const aiModel = assessment.aiModel?.trim() || null;
    const generated = await generate({ topicLabel: label, userId, aiModel });
    const questions = normalizeSkillQuestions(generated.questions);

    assessment.set('questions', questions);
    assessment.status = 'ready';
    assessment.generatedAt = new Date();
    assessment.failureReason = null;
    await assessment.save();
    logger.info({ assessmentId }, 'Skill assessment generation succeeded');
  } catch (err) {
    assessment.status = 'failed';
    assessment.failureReason = err instanceof Error ? err.message : 'generation failed';
    await assessment.save();
    logger.error({ err, assessmentId }, 'Skill assessment generation failed');
  }
}

export async function getSkillAssessment(assessmentId: string) {
  if (!Types.ObjectId.isValid(assessmentId)) throw new AppError(404, 'Assessment not found');
  const assessment = await SkillAssessment.findById(assessmentId);
  if (!assessment) throw new AppError(404, 'Assessment not found');
  if (assessment.expiresAt && assessment.expiresAt < new Date()) {
    throw new AppError(410, 'Assessment has expired');
  }
  return assessment;
}

export async function submitSkillAssessment(
  assessmentId: string,
  answers: SubmittedAnswer[],
  access: AssessmentAccess,
  judge?: ShortAnswerJudge,
) {
  if (!access.userId && !access.guestSessionId) {
    throw new AppError(401, 'Authentication required');
  }

  const assessment = await getSkillAssessment(assessmentId);
  if (resolveAssessmentStatus(assessment) !== 'ready') {
    throw new AppError(409, 'Assessment is not ready yet');
  }

  if (access.userId) {
    await claimGuestAssessments(access.userId, access.guestSessionId);
  }

  assertAssessmentAccess(assessment, access);

  const existingFilter = access.userId
    ? { assessmentId: assessment._id, userId: new Types.ObjectId(access.userId) }
    : { assessmentId: assessment._id, guestSessionId: access.guestSessionId, userId: null };

  const existing = await SkillAssessmentSubmission.findOne(existingFilter);
  if (existing) throw new AppError(409, 'Assessment already submitted');

  const { score, results } = await gradeSubmission(
    assessment.questions as unknown as SkillMcqQuestion[],
    answers,
    judge,
  );
  const level = scoreToLevel(score);
  const submission = await SkillAssessmentSubmission.create({
    assessmentId: assessment._id,
    userId: access.userId ? new Types.ObjectId(access.userId) : null,
    guestSessionId: access.userId ? null : access.guestSessionId ?? null,
    answers,
    results,
    score,
    level,
  });

  if (access.userId) {
    if (!assessment.userId) {
      await SkillAssessment.findByIdAndUpdate(assessment._id, {
        $set: { userId: new Types.ObjectId(access.userId) },
      });
    }

    await User.findByIdAndUpdate(access.userId, {
      $set: {
        'preferences.skillAssessment': {
          topic: assessment.topic,
          customTopic: assessment.customTopic,
          level,
          score,
          assessedAt: new Date(),
        },
      },
    });

    await safeAward(access.userId, { assessmentScore: score });
  }

  return submission;
}

export async function getSkillAssessmentResult(assessmentId: string, access: AssessmentAccess) {
  if (!access.userId && !access.guestSessionId) {
    throw new AppError(401, 'Authentication required');
  }
  if (!Types.ObjectId.isValid(assessmentId)) throw new AppError(404, 'Result not found');

  const assessment = await getSkillAssessment(assessmentId);
  assertAssessmentAccess(assessment, access);

  const submissionFilter = access.userId
    ? { assessmentId, userId: new Types.ObjectId(access.userId) }
    : { assessmentId, guestSessionId: access.guestSessionId, userId: null };

  const submission = await SkillAssessmentSubmission.findOne(submissionFilter);
  if (!submission) throw new AppError(404, 'Result not found');
  return submission;
}

export { scoreToLevel, topicLabel };
