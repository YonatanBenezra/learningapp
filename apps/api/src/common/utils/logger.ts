import { pino } from 'pino';
import { env } from '../../config/env';

// Structured logging (§7.3). Request-scoped child loggers (with request-id) are
// attached to `req.log` by pino-http in app.ts.
//
// pino-pretty is dev-only (devDependency). Referencing it on Vercel/serverless
// crashes because the package is not installed in production.
const usePrettyTransport = env.isDev && !process.env.VERCEL;

export const logger = pino({
  level: env.logLevel,
  base: undefined, // drop pid/hostname noise
  ...(usePrettyTransport
    ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } } }
    : {}),
});
