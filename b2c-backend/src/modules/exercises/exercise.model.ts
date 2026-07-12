import { Schema, model, Types } from 'mongoose';

const exerciseSchema = new Schema(
  {
    lessonId: { type: Types.ObjectId, ref: 'Lesson', required: true, index: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    domain: { type: String, required: true }, // inherited from Module -> lab environment
    taskSpec: {
      description: { type: String },
      starterState: { type: Schema.Types.Mixed }, // starter code / initial fs / scenario data
      rubric: { type: Schema.Types.Mixed }, // evaluation criteria (AI or rule-based)
    },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Exercise = model('Exercise', exerciseSchema);
