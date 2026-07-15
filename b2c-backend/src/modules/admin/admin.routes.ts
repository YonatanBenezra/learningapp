import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as controller from './admin.controller';

const flagSchema = z.object({ reason: z.string().min(1).max(1000) });
const resolveSchema = z.object({ resolution: z.enum(['resolved', 'dismissed']) });
const achievementSchema = z.object({
  key: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  icon: z.string().max(16).optional(),
});

const router = Router();

// Every admin route requires an authenticated admin (§11). Non-admins get 403.
router.use(authenticate, requireRole('admin'));

router.get('/costs', controller.getCosts);
router.get('/metrics', controller.getMetrics);

router.get('/content/:type', controller.listContent);
router.post('/content/:type/:id/flag', validate({ body: flagSchema }), controller.flagContent);
router.post('/content/:type/:id/regenerate', controller.regenerateContent);

router.get('/flags', controller.listFlags);
router.post('/flags/:id/resolve', validate({ body: resolveSchema }), controller.resolveFlag);

router.post('/achievements', validate({ body: achievementSchema }), controller.upsertAchievement);

export default router;
