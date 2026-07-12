import { Schema, model, Types } from 'mongoose';

const subscriptionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
    tier: { type: String, enum: ['free', 'premium'], default: 'free' },
    status: { type: String, enum: ['active', 'canceled', 'past_due'], default: 'active' },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    currentPeriodEnd: { type: Date },
  },
  { timestamps: true },
);

export const Subscription = model('Subscription', subscriptionSchema);
