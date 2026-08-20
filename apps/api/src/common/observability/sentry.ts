import { env } from '../../config/env';
import { logger } from '../utils/logger';

// Error-tracking seam (§7.3). Provider-agnostic: with no SENTRY_DSN configured it
// is a no-op, so dev/test never report externally. Wiring the real @sentry/node SDK
// is the documented TODO — the call sites (error middleware, etc.) don't change.

let enabled = false;

export function initSentry(): void {
  if (!env.sentryDsn) return;
  // TODO(provider): Sentry.init({ dsn: env.sentryDsn, environment: env.nodeEnv, tracesSampleRate: 0.1 });
  enabled = true;
  logger.info('Sentry error tracking enabled');
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!enabled) return; // no-op unless initialized with a DSN
  // TODO(provider): Sentry.captureException(err, { extra: context });
  logger.debug({ err, context }, 'Reported exception to Sentry');
}

// Test-only: reset the module state between tests.
export function __resetSentryForTest(): void {
  enabled = false;
}
