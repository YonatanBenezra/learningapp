import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { pinoHttp } from 'pino-http';

import { env } from './config/env';
import { pingRedis } from './config/redis';
import { logger } from './common/utils/logger';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFoundMiddleware } from './middlewares/notFound.middleware';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import courseRoutes from './modules/courses/course.routes';
import moduleRoutes from './modules/modules-content/module.routes';
import lessonRoutes from './modules/lessons/lesson.routes';
import progressRoutes from './modules/progress/progress.routes';
import exerciseRoutes from './modules/exercises/exercise.routes';
import quizRoutes from './modules/assessments/quiz.routes';
import examRoutes from './modules/assessments/exam.routes';
import skillAssessmentRoutes from './modules/assessments/skillAssessment.routes';
import codeExecRoutes from './modules/labs/code-execution/codeExec.routes';
import terminalRoutes from './modules/labs/terminal-simulator/terminal.routes';
import socRoutes from './modules/labs/soc-simulator/soc.routes';
import networkRoutes from './modules/labs/network-simulator/network.routes';
import gamificationRoutes from './modules/gamification/gamification.routes';
import subscriptionRoutes from './modules/subscriptions/subscription.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import adminRoutes from './modules/admin/admin.routes';
import instructorRoutes from './modules/instructor/instructor.routes';
import marketplaceRoutes from './modules/marketplace/marketplace.routes';

export const app = express();

// Request logging + request-id correlation (§7.3). Echoes an inbound x-request-id or mints one.
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const header = req.headers['x-request-id'];
      const id = (Array.isArray(header) ? header[0] : header) ?? randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
  }),
);

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));

// The Stripe webhook needs the raw body for signature verification, so it must
// bypass the JSON parser (its route mounts express.raw itself).
const jsonParser = express.json({ limit: '1mb' });
app.use((req, res, next) => {
  if (req.path === '/subscriptions/webhook') return next();
  return jsonParser(req, res, next);
});

// Liveness — the process is up (no external dependencies).
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Readiness — external dependencies are reachable.
app.get('/health/ready', async (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  const redisUp = await pingRedis();
  const ready = dbUp && redisUp;
  res
    .status(ready ? 200 : 503)
    .json({
      status: ready ? 'ready' : 'not_ready',
      db: dbUp,
      redis: env.redisEnabled ? redisUp : 'disabled',
    });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/courses', courseRoutes);
app.use('/modules', moduleRoutes);
app.use('/lessons', lessonRoutes);
app.use('/progress', progressRoutes);
app.use('/exercises', exerciseRoutes);
app.use('/quizzes', quizRoutes);
app.use('/exams', examRoutes);
app.use('/skill-assessments', skillAssessmentRoutes);
app.use('/labs/code', codeExecRoutes);
app.use('/labs/terminal', terminalRoutes);
app.use('/labs/soc', socRoutes);
app.use('/labs/network', networkRoutes);
app.use('/gamification', gamificationRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/notifications', notificationRoutes);
app.use('/admin', adminRoutes);
app.use('/instructor', instructorRoutes);
app.use('/marketplace', marketplaceRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
