import { Schema, model, Types } from 'mongoose';

const userLessonProgressSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    lessonId: { type: Types.ObjectId, ref: 'Lesson', required: true, index: true },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

userLessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export const UserLessonProgress = model('UserLessonProgress', userLessonProgressSchema);
