import { Schema, model, Types } from 'mongoose';
import { questionSchema, stripAnswers } from './quiz.model';

const skillAssessmentSchema = new Schema(
  {
    topic: { type: String, required: true, index: true },
    customTopic: { type: String, default: null },
    userId: { type: Types.ObjectId, ref: 'User', default: null, index: true },
    guestSessionId: { type: String, default: null, index: true },
    questions: { type: [questionSchema], default: [] },
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed'],
      default: 'generating',
      index: true,
    },
    failureReason: { type: String, default: null },
    aiModel: { type: String, default: null },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true },
);

skillAssessmentSchema.set('toJSON', { virtuals: true, versionKey: false, transform: stripAnswers });

export const SkillAssessment = model('SkillAssessment', skillAssessmentSchema);
