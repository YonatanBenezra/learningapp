import { Schema, model, Types } from 'mongoose';

const problemSubmissionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    guestSessionId: { type: String, default: null, index: true },
    clientSubmissionId: { type: String, default: null },
    problemSlug: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    difficulty: { type: String, required: true },
    type: { type: String, required: true },
    answer: { type: String, required: true },
    score: { type: Number, required: true },
    correct: { type: Boolean, required: true },
    feedback: { type: String, required: true },
    submittedAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

problemSubmissionSchema.index({ userId: 1, problemSlug: 1 }, { unique: true });

problemSubmissionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret._id;
    return ret;
  },
});

export const ProblemSubmission = model('ProblemSubmission', problemSubmissionSchema);
