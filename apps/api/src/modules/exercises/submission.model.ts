import { Schema, model, Types } from 'mongoose';

const exerciseSubmissionSchema = new Schema(
  {
    exerciseId: { type: Types.ObjectId, ref: 'Exercise', required: true, index: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    submissionData: { type: Schema.Types.Mixed }, // code / commands / config
    score: { type: Number, default: null },
    feedback: { type: String, default: null },
    status: { type: String, enum: ['submitted', 'grading', 'graded'], default: 'submitted' },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

exerciseSubmissionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const out = ret as Record<string, unknown>;
    delete out._id;
    return out;
  },
});

export const ExerciseSubmission = model('ExerciseSubmission', exerciseSubmissionSchema);
