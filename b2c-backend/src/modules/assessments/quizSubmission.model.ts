import { Schema, model, Types } from 'mongoose';

export const answerSchema = new Schema(
  { questionIndex: { type: Number, required: true }, answer: { type: String } },
  { _id: false },
);

const quizSubmissionSchema = new Schema(
  {
    quizId: { type: Types.ObjectId, ref: 'Quiz', required: true, index: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const QuizSubmission = model('QuizSubmission', quizSubmissionSchema);
