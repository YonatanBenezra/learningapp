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

const quizSchema = new Schema(
  {
    lessonId: { type: Types.ObjectId, ref: 'Lesson', required: true, index: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    questions: { type: [questionSchema], default: [] },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Quiz = model('Quiz', quizSchema);
