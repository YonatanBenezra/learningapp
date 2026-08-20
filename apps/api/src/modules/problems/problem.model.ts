import { Schema, model } from 'mongoose';
import { AI_CATEGORY_NAMES } from '@aieng/shared';

const problemSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, enum: AI_CATEGORY_NAMES, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, index: true },
    type: {
      type: String,
      enum: ['mcq', 'short_answer', 'code', 'prompt_design'],
      default: 'mcq',
      required: true,
    },
    prompt: { type: String, required: true },
    options: { type: [String], default: null },
    correctAnswer: { type: String, required: true },
    order: { type: Number, required: true, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

function stripCorrectAnswer(_doc: unknown, ret: Record<string, unknown>): Record<string, unknown> {
  delete ret._id;
  delete ret.correctAnswer;
  return ret;
}

problemSchema.set('toJSON', { virtuals: true, versionKey: false, transform: stripCorrectAnswer });

export const Problem = model('Problem', problemSchema);
