import type { Request, Response, NextFunction } from 'express';
import type { Logger } from 'pino';
import { ZodError } from 'zod';
import { AppError } from '../common/errors/AppError';
import { logger } from '../common/utils/logger';
import { captureException } from '../common/observability/sentry';

type RequestWithLog = Request & { id?: string; log?: Logger };

export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const { id: requestId, log } = req as RequestWithLog;

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.flatten().fieldErrors,
      requestId,
    });
  }

  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ error: err.message, details: err.details, requestId });
  }

  (log ?? logger).error({ err }, 'Unhandled error');
  captureException(err, { requestId }); // report only truly unexpected (500) errors
  return res.status(500).json({ error: 'Internal Server Error', requestId });
}
