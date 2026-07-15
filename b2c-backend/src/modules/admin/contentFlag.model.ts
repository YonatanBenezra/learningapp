import { Schema, model, Types } from 'mongoose';

// Generic moderation flag over any AI-generated content (§11). Kept separate from
// the content models so flagging spans course/lesson/exercise/quiz uniformly.
const contentFlagSchema = new Schema(
  {
    contentType: { type: String, enum: ['course', 'lesson', 'exercise', 'quiz'], required: true },
    contentId: { type: Types.ObjectId, required: true, index: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', index: true },
    flaggedBy: { type: Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

contentFlagSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const ContentFlag = model('ContentFlag', contentFlagSchema);
