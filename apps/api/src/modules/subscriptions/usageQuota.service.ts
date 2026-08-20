import { UsageQuota } from './usageQuota.model';
import { AppError } from '../../common/errors/AppError';
import { tierLimits, isUnlimitedLimit } from '../../config/tiers';

export type QuotaKind = 'course' | 'exercise' | 'quiz' | 'exam' | 'lab';
export type QuotaPeriod = 'daily' | 'monthly';

const KIND_TO_COUNT: Record<QuotaKind, string> = {
  course: 'courseGenerations',
  exercise: 'exerciseGenerations',
  quiz: 'quizGenerations',
  exam: 'examGenerations',
  lab: 'labExecutions',
};

const KIND_TO_LIMIT = {
  course: 'courseGenerationsPerDay',
  exercise: 'exerciseGenerationsPerDay',
  quiz: 'quizGenerationsPerMonth',
  exam: 'examGenerationsPerMonth',
  lab: 'labExecutionsPerDay',
} as const;

const KIND_PERIOD: Record<QuotaKind, QuotaPeriod> = {
  course: 'daily',
  exercise: 'daily',
  quiz: 'monthly',
  exam: 'monthly',
  lab: 'daily',
};

const ZERO_COUNTS = {
  courseGenerations: 0,
  exerciseGenerations: 0,
  quizGenerations: 0,
  examGenerations: 0,
  labExecutions: 0,
};

export class QuotaError extends AppError {
  constructor(
    public readonly limit: number,
    public readonly kind: QuotaKind,
    period: QuotaPeriod,
  ) {
    const unit = period === 'monthly' ? 'month' : 'day';
    super(429, `${kind} generation limit reached (${limit}/${unit}). Upgrade for more.`);
    this.name = 'QuotaError';
  }
}

function utcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function utcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function periodFor(kind: QuotaKind): QuotaPeriod {
  return KIND_PERIOD[kind];
}

function periodStartFor(kind: QuotaKind, now: Date): Date {
  return periodFor(kind) === 'monthly' ? utcMonth(now) : utcDay(now);
}

export function limitFor(tier: string, kind: QuotaKind): number {
  const limits = tierLimits(tier);
  return limits[KIND_TO_LIMIT[kind]];
}

export async function consumeQuota(
  userId: string,
  tier: string,
  kind: QuotaKind,
  now: Date = new Date(),
): Promise<{ limit: number; used: number }> {
  const period = periodFor(kind);
  const periodStart = periodStartFor(kind, now);
  const countKey = KIND_TO_COUNT[kind];
  const limit = limitFor(tier, kind);
  if (isUnlimitedLimit(limit)) {
    return { limit, used: 0 };
  }

  try {
    await UsageQuota.updateOne(
      { userId, period, periodStart },
      { $setOnInsert: { counts: ZERO_COUNTS } },
      { upsert: true },
    );
  } catch (err) {
    if (!(err instanceof Error && err.message.includes('E11000'))) throw err;
  }

  const updated = await UsageQuota.findOneAndUpdate(
    { userId, period, periodStart, [`counts.${countKey}`]: { $lt: limit } },
    { $inc: { [`counts.${countKey}`]: 1 } },
    { new: true },
  );
  if (!updated) throw new QuotaError(limit, kind, period);

  const used = (updated.counts as unknown as Record<string, number>)[countKey];
  return { limit, used };
}

export async function refundQuota(
  userId: string,
  kind: QuotaKind,
  now: Date = new Date(),
): Promise<void> {
  const period = periodFor(kind);
  const periodStart = periodStartFor(kind, now);
  const countKey = KIND_TO_COUNT[kind];
  await UsageQuota.updateOne(
    { userId, period, periodStart, [`counts.${countKey}`]: { $gt: 0 } },
    { $inc: { [`counts.${countKey}`]: -1 } },
  );
}

export async function getQuota(userId: string, tier: string, now: Date = new Date()) {
  const dailyStart = utcDay(now);
  const monthlyStart = utcMonth(now);
  const [dailyDoc, monthlyDoc] = await Promise.all([
    UsageQuota.findOne({ userId, period: 'daily', periodStart: dailyStart }),
    UsageQuota.findOne({ userId, period: 'monthly', periodStart: monthlyStart }),
  ]);
  const daily = (dailyDoc?.counts as unknown as Record<string, number>) ?? { ...ZERO_COUNTS };
  const monthly = (monthlyDoc?.counts as unknown as Record<string, number>) ?? { ...ZERO_COUNTS };
  return {
    period: 'daily' as const,
    periodStart: dailyStart,
    counts: {
      courseGenerations: daily.courseGenerations ?? 0,
      exerciseGenerations: daily.exerciseGenerations ?? 0,
      quizGenerations: monthly.quizGenerations ?? 0,
      examGenerations: monthly.examGenerations ?? 0,
      labExecutions: daily.labExecutions ?? 0,
    },
    limits: tierLimits(tier),
  };
}
