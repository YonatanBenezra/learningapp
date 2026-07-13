import { Schema, model, Types } from 'mongoose';

const userLessonProgressSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    lessonId: { type: Types.ObjectId, ref: 'Lesson', required: true, index: true },
    // Denormalized so course-scoped progress (%) is a single count query.
    courseId: { type: Types.ObjectId, ref: 'Course', required: true, index: true },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userLessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

userLessonProgressSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const out = ret as Record<string, unknown>;
    delete out._id;
    return out;
  },
});

export const UserLessonProgress = model('UserLessonProgress', userLessonProgressSchema);
