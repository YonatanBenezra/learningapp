import { UsageQuota } from './usageQuota.model';
import { AppError } from '../../common/errors/AppError';
import { TIER_LIMITS } from '../../config/constants';

export type QuotaKind = 'course' | 'exercise' | 'quiz' | 'exam' | 'lab';

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
  quiz: 'quizGenerationsPerDay',
  exam: 'examGenerationsPerDay',
  lab: 'labExecutionsPerDay',
} as const;

const ZERO_COUNTS = {
  courseGenerations: 0,
  exerciseGenerations: 0,
  quizGenerations: 0,
  examGenerations: 0,
  labExecutions: 0,
};

// 429 raised when a per-day quota is exhausted.
export class QuotaError extends AppError {
  constructor(
    public readonly limit: number,
    public readonly kind: QuotaKind,
  ) {
    super(429, `Daily ${kind} generation limit reached (${limit}/day). Upgrade for more.`);
    this.name = 'QuotaError';
  }
}

function utcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function limitFor(tier: string, kind: QuotaKind): number {
  const limits = TIER_LIMITS[tier === 'premium' ? 'premium' : 'free'];
  return limits[KIND_TO_LIMIT[kind]];
}

// Atomically consumes one unit of the given quota for the user's current day.
// The daily doc is keyed by (userId, period, periodStart) so a new day starts a
// fresh doc — no reset job needed. Throws QuotaError (429) when the limit is hit.
export async function consumeQuota(
  userId: string,
  tier: string,
  kind: QuotaKind,
  now: Date = new Date(),
): Promise<{ limit: number; used: number }> {
  const periodStart = utcDay(now);
  const countKey = KIND_TO_COUNT[kind];
  const limit = limitFor(tier, kind);

  // Ensure today's doc exists (benign duplicate-key race under concurrency is ignored).
  try {
    await UsageQuota.updateOne(
      { userId, period: 'daily', periodStart },
      { $setOnInsert: { counts: ZERO_COUNTS } },
      { upsert: true },
    );
  } catch (err) {
    if (!(err instanceof Error && err.message.includes('E11000'))) throw err;
  }

  // Atomic, race-safe increment that only succeeds while under the limit.
  const updated = await UsageQuota.findOneAndUpdate(
    { userId, period: 'daily', periodStart, [`counts.${countKey}`]: { $lt: limit } },
    { $inc: { [`counts.${countKey}`]: 1 } },
    { new: true },
  );
  if (!updated) throw new QuotaError(limit, kind);

  const used = (updated.counts as unknown as Record<string, number>)[countKey];
  return { limit, used };
}

// Current-day usage snapshot for a user (for the admin cost view / a usage endpoint).
export async function getQuota(userId: string, tier: string, now: Date = new Date()) {
  const periodStart = utcDay(now);
  const doc = await UsageQuota.findOne({ userId, period: 'daily', periodStart });
  const counts = (doc?.counts as unknown as Record<string, number>) ?? { ...ZERO_COUNTS };
  return {
    period: 'daily' as const,
    periodStart,
    counts,
    limits: TIER_LIMITS[tier === 'premium' ? 'premium' : 'free'],
  };
}
