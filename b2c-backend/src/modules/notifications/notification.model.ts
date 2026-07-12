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

export const Notification = model('Notification', notificationSchema);
