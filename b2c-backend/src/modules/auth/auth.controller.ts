import { asyncHandler } from '../../common/utils/asyncHandler';
import * as authService from './auth.service';
import { loginWithGoogle } from './oauth.service';

export const signup = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.signup(req.body);
  res.status(201).json({ user, accessToken, refreshToken });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  res.json({ user, accessToken, refreshToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.refresh(req.body.refreshToken);
  res.json({ user, accessToken, refreshToken });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(204).send();
});

export const googleOAuth = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await loginWithGoogle(req.body.idToken);
  res.json({ user, accessToken, refreshToken });
});
