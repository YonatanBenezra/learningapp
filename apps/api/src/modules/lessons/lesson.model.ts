import { Schema, model, Types } from 'mongoose';

const lessonSchema = new Schema(
  {
    moduleId: { type: Types.ObjectId, ref: 'Module', required: true, index: true },
    // Denormalized from Module for efficient ownership checks + progress-% recompute.
    courseId: { type: Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true },
    content: { type: Schema.Types.Mixed }, // AI-generated content block(s)
    order: { type: Number, required: true },
  },
  { timestamps: true },
);

lessonSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const out = ret as Record<string, unknown>;
    delete out._id;
    return out;
  },
});

export const Lesson = model('Lesson', lessonSchema);
