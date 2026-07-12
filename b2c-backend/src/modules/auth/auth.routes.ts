import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { rateLimit } from '../../middlewares/rateLimit.middleware';
import {
  signupSchema,
  loginSchema,
  refreshSchema,
  oauthGoogleSchema,
} from './auth.validation';
import * as controller from './auth.controller';

const router = Router();

// Basic abuse protection on credential endpoints (§7.1).
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: 'auth' });

router.post('/signup', authLimiter, validate({ body: signupSchema }), controller.signup);
router.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);
router.post('/refresh', validate({ body: refreshSchema }), controller.refresh);
router.post('/logout', validate({ body: refreshSchema }), controller.logout);
router.post('/oauth/google', authLimiter, validate({ body: oauthGoogleSchema }), controller.googleOAuth);

export default router;
