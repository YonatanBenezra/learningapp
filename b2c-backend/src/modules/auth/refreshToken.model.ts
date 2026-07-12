import { Schema, model, Types } from 'mongoose';

// One record per issued refresh token. Rotation marks the old record `used` and links
// `replacedByJti`; presenting a `used` token again is treated as reuse → the whole
// `familyId` is revoked (§7.1 JWT rotation + reuse detection).
const refreshTokenSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    jti: { type: String, required: true, unique: true, index: true },
    familyId: { type: String, required: true, index: true },
    used: { type: Boolean, default: false },
    revoked: { type: Boolean, default: false },
    replacedByJti: { type: String, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL cleanup — Mongo removes records once past `expiresAt`.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model('RefreshToken', refreshTokenSchema);
