import { pino } from 'pino';
import { env } from '../../config/env';

// Structured logging (§7.3). Request-scoped child loggers (with request-id) are
// attached to `req.log` by pino-http in app.ts.
export const logger = pino({
  level: env.logLevel,
  base: undefined, // drop pid/hostname noise
  transport: env.isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
    : undefined,
});
