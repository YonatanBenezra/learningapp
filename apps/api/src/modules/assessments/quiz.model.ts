import { Schema, model, Types } from 'mongoose';

export const questionSchema = new Schema(
  {
    question: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'short_answer'], required: true },
    options: { type: [String], default: null },
    correctAnswer: { type: String, required: true }, // reference answer for short_answer
  },
  { _id: false },
);

// Strips correct answers from questions so a quiz can be served for taking without
// leaking the key. Grading reads correctAnswer from the doc directly (not via toJSON).
function stripAnswers(_doc: unknown, ret: Record<string, unknown>): Record<string, unknown> {
  delete ret._id;
  if (Array.isArray(ret.questions)) {
    ret.questions = (ret.questions as Array<Record<string, unknown>>).map((q) => {
      const copy = { ...q };
      delete copy.correctAnswer;
      return copy;
    });
  }
  return ret;
}

const quizSchema = new Schema(
  {
    lessonId: { type: Types.ObjectId, ref: 'Lesson', required: true, index: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    questions: { type: [questionSchema], default: [] },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

quizSchema.set('toJSON', { virtuals: true, versionKey: false, transform: stripAnswers });

export const Quiz = model('Quiz', quizSchema);
export { stripAnswers };
