import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import type { Role, Tier } from '../../common/types';

const ACCESS_TTL = '15m';
export const REFRESH_TTL_DAYS = 30;
const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;

export interface AccessPayload {
  sub: string;
  role: Role;
  tier: Tier;
}

export interface RefreshPayload {
  sub: string;
  jti: string;
  family: string;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(payload: RefreshPayload): { token: string; expiresAt: Date } {
  const token = jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: `${REFRESH_TTL_DAYS}d` });
  return { token, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) };
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as RefreshPayload;
}

export const newId = (): string => randomUUID();
