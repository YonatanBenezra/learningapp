import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    // Never selected by default — must be explicitly requested with `.select('+passwordHash')`.
    passwordHash: { type: String, select: false },
    oauth: { provider: String, providerId: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    tier: { type: String, enum: ['free', 'premium'], default: 'free' },
    preferences: {
      visualsPreferred: { type: Boolean, default: false },
      dailyNotification: { type: Boolean, default: false },
      timezone: { type: String, default: 'UTC' },
    },
    streak: {
      current: { type: Number, default: 0 },
      lastActivityDate: { type: Date },
    },
    // Soft-delete (§12): set on account deletion; blocks login; purge job hard-deletes later.
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

// Strip sensitive/internal fields from any JSON response and expose `id`.
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const out = ret as Record<string, unknown>;
    delete out._id;
    delete out.passwordHash;
    return out;
  },
});

export const User = model('User', userSchema);
