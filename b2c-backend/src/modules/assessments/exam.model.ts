import { Schema, model, Types } from 'mongoose';
import { questionSchema, stripAnswers } from './quiz.model';

const examSchema = new Schema(
  {
    scope: { type: String, enum: ['module', 'course'], required: true },
    scopeId: { type: Types.ObjectId, required: true, index: true }, // Module._id or Course._id
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    questions: { type: [questionSchema], default: [] },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

examSchema.set('toJSON', { virtuals: true, versionKey: false, transform: stripAnswers });

export const Exam = model('Exam', examSchema);
