import { Schema, model } from 'mongoose';
import { AI_CATEGORY_NAMES } from '@aieng/shared';

export const SIMULATION_KINDS = ['prompt_lab', 'vector_playground', 'rag_pipeline', 'guardrails'] as const;

const simulationSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, enum: AI_CATEGORY_NAMES, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, index: true },
    kind: { type: String, enum: SIMULATION_KINDS, required: true, index: true },
    description: { type: String, required: true },
    taskPrompt: { type: String, required: true },
    sampleInput: { type: String, required: true },
    order: { type: Number, required: true, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

simulationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    delete ret._id;
    return ret;
  },
});

export const Simulation = model('Simulation', simulationSchema);
