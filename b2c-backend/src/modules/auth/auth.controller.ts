import { asyncHandler } from '../../common/utils/asyncHandler';
import { AppError } from '../../common/errors/AppError';
import {
  clearAuthCookies,
  extractRefreshToken,
  readAccessToken,
  setAuthCookies,
} from './authCookies';
import * as authService from './auth.service';
import { loginWithGoogle } from './oauth.service';
import { verifyAccessToken } from './token.service';
import { User } from '../users/user.model';

function sendAuthResponse(
  res: Parameters<typeof setAuthCookies>[0],
  payload: { user: unknown; accessToken: string; refreshToken: string },
) {
  setAuthCookies(res, {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  });
  res.json({ user: payload.user });
}

export const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  sendAuthResponse(res, result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  sendAuthResponse(res, result);
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = extractRefreshToken(req, req.body.refreshToken);
  if (!refreshToken) throw new AppError(401, 'Missing refresh token');
  const result = await authService.refresh(refreshToken);
  sendAuthResponse(res, result);
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = extractRefreshToken(req, req.body.refreshToken);
  if (refreshToken) await authService.logout(refreshToken);
  clearAuthCookies(res);
  res.status(204).send();
});

export const googleOAuth = asyncHandler(async (req, res) => {
  const result = await loginWithGoogle(req.body.idToken);
  sendAuthResponse(res, result);
});

export const session = asyncHandler(async (req, res) => {
  const accessToken = readAccessToken(req);
  if (!accessToken) throw new AppError(401, 'Not authenticated');
  const payload = verifyAccessToken(accessToken);
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, 'Not authenticated');
  res.json({ user });
});
