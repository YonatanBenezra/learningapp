import { Schema, model, Types } from 'mongoose';

const moduleSchema = new Schema(
  {
    courseId: { type: Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true },
    // drives which lab environment launches for this module's exercises (§2)
    domain: {
      type: String,
      enum: ['programming', 'networking', 'cybersecurity', 'os', 'general'],
      required: true,
    },
    lessonOrder: [{ type: Types.ObjectId, ref: 'Lesson' }],
    order: { type: Number, required: true },
  },
  { timestamps: true },
);

moduleSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const out = ret as Record<string, unknown>;
    delete out._id;
    return out;
  },
});

export const Module = model('Module', moduleSchema);
