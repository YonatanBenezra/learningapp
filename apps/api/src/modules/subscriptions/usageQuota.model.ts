import { Schema, model, Types } from 'mongoose';

// Tracks AI calls per user per period, enforced server-side before AI endpoints (§9).
const usageQuotaSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    period: { type: String, enum: ['daily', 'monthly'], required: true },
    periodStart: { type: Date, required: true },
    counts: {
      courseGenerations: { type: Number, default: 0 },
      exerciseGenerations: { type: Number, default: 0 },
      quizGenerations: { type: Number, default: 0 },
      examGenerations: { type: Number, default: 0 },
      labExecutions: { type: Number, default: 0 },
    },
    limits: { type: Schema.Types.Mixed }, // tier-based limits, free vs premium
  },
  { timestamps: true },
);

usageQuotaSchema.index({ userId: 1, period: 1, periodStart: 1 }, { unique: true });

export const UsageQuota = model('UsageQuota', usageQuotaSchema);
