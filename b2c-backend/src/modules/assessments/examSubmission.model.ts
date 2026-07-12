import { Schema, model, Types } from 'mongoose';
import { answerSchema } from './quizSubmission.model';

const examSubmissionSchema = new Schema(
  {
    examId: { type: Types.ObjectId, ref: 'Exam', required: true, index: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const ExamSubmission = model('ExamSubmission', examSubmissionSchema);
