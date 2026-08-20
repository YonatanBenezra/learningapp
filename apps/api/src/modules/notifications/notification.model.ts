import { Schema, model, Types } from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    channel: { type: String, enum: ['email', 'push'], default: 'email' },
    payload: { type: Schema.Types.Mixed },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    sentAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const Notification = model('Notification', notificationSchema);
