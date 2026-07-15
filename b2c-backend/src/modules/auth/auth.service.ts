import bcrypt from 'bcryptjs';
import { User } from '../users/user.model';
import { RefreshToken } from './refreshToken.model';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  newId,
  type RefreshPayload,
} from './token.service';
import { AppError } from '../../common/errors/AppError';
import type { Role, Tier } from '../../common/types';

const SALT_ROUNDS = 12;

interface TokenUser {
  userId: string;
  role: string;
  tier: string;
}

export async function issueTokenPair(
  user: TokenUser,
): Promise<{ accessToken: string; refreshToken: string }> {
  const family = newId();
  const jti = newId();
  const accessToken = signAccessToken({
    sub: user.userId,
    role: user.role as Role,
    tier: user.tier as Tier,
  });
  const { token: refreshToken, expiresAt } = signRefreshToken({ sub: user.userId, jti, family });
  await RefreshToken.create({ userId: user.userId, jti, familyId: family, expiresAt });
  return { accessToken, refreshToken };
}

export async function signup(input: { email: string; password: string }) {
  const email = input.email.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) throw new AppError(409, 'Email already registered');
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({ email, passwordHash });
  const tokens = await issueTokenPair({ userId: String(user._id), role: user.role, tier: user.tier });
  return { user, ...tokens };
}

export async function login(input: { email: string; password: string }) {
  const email = input.email.toLowerCase().trim();
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user?.passwordHash) throw new AppError(401, 'Invalid credentials');
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new AppError(401, 'Invalid credentials');
  if (user.deletedAt) throw new AppError(403, 'This account has been deactivated.');
  const tokens = await issueTokenPair({ userId: String(user._id), role: user.role, tier: user.tier });
  return { user, ...tokens };
}

export async function refresh(token: string) {
  let payload: RefreshPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }

  const record = await RefreshToken.findOne({ jti: payload.jti });
  if (!record || record.revoked) throw new AppError(401, 'Invalid refresh token');

  if (record.used) {
    // Replay of an already-rotated token — revoke the entire family as a precaution.
    await RefreshToken.updateMany({ familyId: record.familyId }, { revoked: true });
    throw new AppError(401, 'Refresh token reuse detected');
  }

  const user = await User.findById(record.userId);
  if (!user || user.deletedAt) throw new AppError(401, 'Invalid refresh token');

  // Rotate within the same family.
  const userId = String(user._id);
  const jti = newId();
  const accessToken = signAccessToken({
    sub: userId,
    role: user.role as Role,
    tier: user.tier as Tier,
  });
  const { token: refreshToken, expiresAt } = signRefreshToken({
    sub: userId,
    jti,
    family: record.familyId,
  });
  record.used = true;
  record.replacedByJti = jti;
  await record.save();
  await RefreshToken.create({ userId, jti, familyId: record.familyId, expiresAt });

  return { user, accessToken, refreshToken };
}

export async function logout(token: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(token);
    const record = await RefreshToken.findOne({ jti: payload.jti });
    if (record) await RefreshToken.updateMany({ familyId: record.familyId }, { revoked: true });
  } catch {
    // Ignore invalid tokens on logout — nothing to revoke.
  }
}
