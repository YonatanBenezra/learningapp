import { Schema, model, Types } from 'mongoose';

const courseSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    topics: { type: [String], default: [] },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    preferences: {
      visualsPreferred: { type: Boolean, default: false },
      dailyNotification: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed', 'archived', 'completed'],
      default: 'generating',
      index: true,
    },
    moduleOrder: [{ type: Types.ObjectId, ref: 'Module' }],
    progressPercent: { type: Number, default: 0 },
    failureReason: { type: String, default: null },
    generatedAt: { type: Date },
  },
  { timestamps: true },
);

courseSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const out = ret as Record<string, unknown>;
    delete out._id;
    return out;
  },
});

export const Course = model('Course', courseSchema);
