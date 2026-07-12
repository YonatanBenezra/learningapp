import { Schema, model, Types } from 'mongoose';

// Per-call AI usage + cost. Feeds §9 quota accounting and the §11 admin cost dashboard.
const aiUsageSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', index: true, default: null },
    useCase: { type: String, required: true, index: true },
    model: { type: String, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    cacheReadInputTokens: { type: Number, default: 0 },
    cacheCreationInputTokens: { type: Number, default: 0 },
    costUsd: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const AiUsage = model('AiUsage', aiUsageSchema);
