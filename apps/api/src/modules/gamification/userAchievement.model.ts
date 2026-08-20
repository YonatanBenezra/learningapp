import { Schema, model, Types } from 'mongoose';

const userAchievementSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    achievementId: { type: Types.ObjectId, ref: 'Achievement', required: true, index: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export const UserAchievement = model('UserAchievement', userAchievementSchema);
