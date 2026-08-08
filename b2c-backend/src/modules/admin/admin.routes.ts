import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { setUserRoleSchema } from '../instructor/instructor.validation';
import * as controller from './admin.controller';

const flagSchema = z.object({ reason: z.string().min(1).max(1000) });
const resolveSchema = z.object({ resolution: z.enum(['resolved', 'dismissed']) });
const achievementSchema = z.object({
  key: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  icon: z.string().max(16).optional(),
});
const broadcastSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
});

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/metrics', controller.getMetrics);
router.get('/costs', controller.getCosts);
router.get('/activity', controller.getActivity);
router.get('/system', controller.getSystem);
router.get('/subscriptions', controller.getSubscriptions);
router.get('/assessments', controller.getAssessments);
router.get('/marketplace', controller.getMarketplace);
router.get('/marketplace/courses/:id', controller.getMarketplaceCourse);

router.get('/users', controller.listUsers);
router.patch('/users/:id/role', validate({ body: setUserRoleSchema }), controller.setUserRole);

router.get('/achievements', controller.listAchievements);
router.post('/achievements', validate({ body: achievementSchema }), controller.upsertAchievement);

router.get('/notifications', controller.listAdminNotifications);
router.post('/notifications/broadcast', validate({ body: broadcastSchema }), controller.broadcastNotification);

router.get('/content/:type', controller.listContent);
router.post('/content/:type/:id/flag', validate({ body: flagSchema }), controller.flagContent);
router.post('/content/:type/:id/regenerate', controller.regenerateContent);

router.get('/flags', controller.listFlags);
router.post('/flags/:id/resolve', validate({ body: resolveSchema }), controller.resolveFlag);

export default router;
