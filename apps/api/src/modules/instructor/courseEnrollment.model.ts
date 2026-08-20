import { Schema, model, Types } from 'mongoose';

const courseEnrollmentSchema = new Schema(
  {
    instructorId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Types.ObjectId, ref: 'Course', required: true, index: true },
    studentId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    studentEmail: { type: String, required: true },
    amountCents: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['completed', 'pending', 'refunded'],
      default: 'completed',
      index: true,
    },
    purchasedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

courseEnrollmentSchema.index({ instructorId: 1, purchasedAt: -1 });
courseEnrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

courseEnrollmentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const out = ret as Record<string, unknown>;
    delete out._id;
    return out;
  },
});

export const CourseEnrollment = model('CourseEnrollment', courseEnrollmentSchema);
