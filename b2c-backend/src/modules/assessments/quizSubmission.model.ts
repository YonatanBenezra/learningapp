import { Schema, model, Types } from 'mongoose';

export const answerSchema = new Schema(
  { questionIndex: { type: Number, required: true }, answer: { type: String } },
  { _id: false },
);

// Per-question grading outcome — kept so the "correct answers + feedback" are shown after submit.
export const resultSchema = new Schema(
  {
    questionIndex: { type: Number, required: true },
    correct: { type: Boolean, required: true },
    correctAnswer: { type: String },
    feedback: { type: String },
  },
  { _id: false },
);

function stripId(_doc: unknown, ret: Record<string, unknown>): Record<string, unknown> {
  delete ret._id;
  return ret;
}

const quizSubmissionSchema = new Schema(
  {
    quizId: { type: Types.ObjectId, ref: 'Quiz', required: true, index: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    answers: { type: [answerSchema], default: [] },
    results: { type: [resultSchema], default: [] },
    score: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

quizSubmissionSchema.set('toJSON', { virtuals: true, versionKey: false, transform: stripId });

export const QuizSubmission = model('QuizSubmission', quizSubmissionSchema);
export { stripId };
