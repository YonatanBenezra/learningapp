import { Schema, model, Types } from 'mongoose';
import { answerSchema, resultSchema, stripId } from './quizSubmission.model';

const skillAssessmentSubmissionSchema = new Schema(
  {
    assessmentId: { type: Types.ObjectId, ref: 'SkillAssessment', required: true, index: true },
    userId: { type: Types.ObjectId, ref: 'User', default: null, index: true },
    guestSessionId: { type: String, default: null, index: true },
    answers: { type: [answerSchema], default: [] },
    results: { type: [resultSchema], default: [] },
    score: { type: Number, default: 0 },
    level: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

skillAssessmentSubmissionSchema.index(
  { assessmentId: 1, userId: 1 },
  {
    unique: true,
    name: 'skill_assessment_submission_user_unique',
    partialFilterExpression: { userId: { $type: 'objectId' } },
  },
);
skillAssessmentSubmissionSchema.index(
  { assessmentId: 1, guestSessionId: 1 },
  {
    unique: true,
    name: 'skill_assessment_submission_guest_unique',
    partialFilterExpression: { guestSessionId: { $type: 'string' }, userId: null },
  },
);

const LEGACY_SUBMISSION_INDEXES = ['assessmentId_1_userId_1', 'assessmentId_1_guestSessionId_1'] as const;

/** Drop legacy indexes that conflict with partial unique index names. */
export async function migrateSkillAssessmentSubmissionIndexes(): Promise<void> {
  const collection = SkillAssessmentSubmission.collection;
  const indexes = await collection.indexes();
  const names = new Set(indexes.map((idx) => idx.name));

  for (const legacyName of LEGACY_SUBMISSION_INDEXES) {
    if (!names.has(legacyName)) continue;
    await collection.dropIndex(legacyName);
  }
}

skillAssessmentSubmissionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: stripId,
});

export const SkillAssessmentSubmission = model(
  'SkillAssessmentSubmission',
  skillAssessmentSubmissionSchema,
);
