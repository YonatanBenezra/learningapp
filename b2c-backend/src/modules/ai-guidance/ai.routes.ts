import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { rateLimit } from '../../middlewares/rateLimit.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { listModels, listPlatformChatModelOptions, platformChat } from './ai.controller';
import { platformChatSchema } from './platformChat.validation';

const router = Router();

const platformChatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  keyPrefix: 'platform-chat',
});

router.get('/models', authenticate, listModels);
router.get('/platform-chat/models', listPlatformChatModelOptions);
router.post(
  '/platform-chat',
  platformChatLimiter,
  validate({ body: platformChatSchema }),
  platformChat,
);

export default router;
