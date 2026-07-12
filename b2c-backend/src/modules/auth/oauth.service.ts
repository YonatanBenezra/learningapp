import { OAuth2Client } from 'google-auth-library';
import { User } from '../users/user.model';
import { AppError } from '../../common/errors/AppError';
import { env } from '../../config/env';
import { issueTokenPair } from './auth.service';

export interface OAuthProfile {
  provider: 'google';
  providerId: string;
  email: string;
  name?: string;
}

// Find by provider identity → else link to an existing email account → else create.
export async function upsertOAuthUser(profile: OAuthProfile) {
  let user = await User.findOne({
    'oauth.provider': profile.provider,
    'oauth.providerId': profile.providerId,
  });

  if (!user) {
    const email = profile.email.toLowerCase().trim();
    user = await User.findOne({ email });
    if (user) {
      user.oauth = { provider: profile.provider, providerId: profile.providerId };
      await user.save();
    } else {
      user = await User.create({
        email,
        oauth: { provider: profile.provider, providerId: profile.providerId },
      });
    }
  }

  return user;
}

export async function loginWithGoogle(idToken: string) {
  if (!env.googleClientId) throw new AppError(501, 'Google OAuth is not configured');
  const client = new OAuth2Client(env.googleClientId);

  let email: string | undefined;
  let sub: string | undefined;
  let name: string | undefined;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: env.googleClientId });
    const payload = ticket.getPayload();
    email = payload?.email;
    sub = payload?.sub;
    name = payload?.name;
  } catch {
    throw new AppError(401, 'Invalid Google token');
  }
  if (!email || !sub) throw new AppError(401, 'Google token missing required claims');

  const user = await upsertOAuthUser({ provider: 'google', providerId: sub, email, name });
  const tokens = await issueTokenPair({
    userId: String(user._id),
    role: user.role,
    tier: user.tier,
  });
  return { user, ...tokens };
}
