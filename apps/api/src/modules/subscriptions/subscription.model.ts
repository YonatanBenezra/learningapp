import { Schema, model, Types } from 'mongoose';

// One subscription record per user, kept in sync with Stripe via webhooks (§7).
// User.tier is the fast-path source of truth for gating; this holds the billing detail.
const subscriptionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
    tier: { type: String, enum: ['free', 'standard', 'premium'], default: 'free' },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'incomplete'],
      default: 'active',
    },
    stripeCustomerId: { type: String, index: true },
    stripeSubscriptionId: { type: String },
    priceId: { type: String },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    trialEndsAt: { type: Date, default: null },
  },
  { timestamps: true },
);

subscriptionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const Subscription = model('Subscription', subscriptionSchema);
