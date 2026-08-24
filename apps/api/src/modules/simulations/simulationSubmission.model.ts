import { Schema, model, Types } from 'mongoose';

const simulationSubmissionSchema = new Schema(
  {
    simulationSlug: { type: String, required: true, index: true, trim: true },
    kind: {
      type: String,
      enum: ['prompt_lab', 'vector_playground', 'rag_pipeline', 'guardrails'],
      required: true,
      index: true,
    },
    userId: { type: Types.ObjectId, ref: 'User', default: null, index: true },
    guestSessionId: { type: String, default: null, index: true, trim: true },
    prompt: { type: String, required: true },
    modelOutput: { type: String, required: true },
    modelId: { type: String, default: null },
    inputTokens: { type: Number, default: null },
    outputTokens: { type: Number, default: null },
    costUsd: { type: Number, default: null },
    score: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    feedback: { type: String, required: true },
    rubricBreakdown: { type: [Schema.Types.Mixed], default: [] },
    status: { type: String, enum: ['graded'], default: 'graded' },
    gradedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

simulationSubmissionSchema.index(
  { simulationSlug: 1, userId: 1, createdAt: -1 },
  { partialFilterExpression: { userId: { $type: 'objectId' } } },
);
simulationSubmissionSchema.index(
  { simulationSlug: 1, guestSessionId: 1, createdAt: -1 },
  { partialFilterExpression: { guestSessionId: { $type: 'string' } } },
);

simulationSubmissionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret: Record<string, unknown>) {
    delete ret._id;
    return ret;
  },
});

export const SimulationSubmission = model('SimulationSubmission', simulationSubmissionSchema);
