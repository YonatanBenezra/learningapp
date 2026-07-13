import { Schema, model, Types } from 'mongoose';
import { answerSchema, resultSchema, stripId } from './quizSubmission.model';

const examSubmissionSchema = new Schema(
  {
    examId: { type: Types.ObjectId, ref: 'Exam', required: true, index: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    answers: { type: [answerSchema], default: [] },
    results: { type: [resultSchema], default: [] },
    score: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

examSubmissionSchema.set('toJSON', { virtuals: true, versionKey: false, transform: stripId });

export const ExamSubmission = model('ExamSubmission', examSubmissionSchema);
