import { Schema, model, Types } from 'mongoose';

const userPracticeProgressSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    completedSlugs: { type: [String], default: [] },
    skillByTopic: { type: Schema.Types.Mixed, default: {} },
    totalCompleted: { type: Number, default: 0 },
    lastProblemSlug: { type: String, default: null },
    guestSessionId: { type: String, default: null },
    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userPracticeProgressSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret._id;
    return ret;
  },
});

export const UserPracticeProgress = model('UserPracticeProgress', userPracticeProgressSchema);
