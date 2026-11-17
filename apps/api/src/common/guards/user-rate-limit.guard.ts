import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

export type RateLimitOptions = {
  /** Requests that share a bucket share one counter per caller. */
  bucket: string;
  max: number;
  windowMs: number;
};

const RATE_LIMIT_KEY = 'userRateLimit';

/** Per-caller fixed-window limit; use with `@UseGuards(UserRateLimitGuard)`. */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

/**
 * In-memory fixed window keyed by the signed-in user (or client IP when the
 * route is public). Good enough for a single API process; move the counter to
 * Redis before running several API replicas.
 */
@Injectable()
export class UserRateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<
      RateLimitOptions | undefined
    >(RATE_LIMIT_KEY, [context.getHandler(), context.getClass()]);
    if (!options) {
      return true;
    }
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { id?: string } }>();
    const caller = request.user?.id ?? `ip:${clientIp(request)}`;
    const key = `${options.bucket}:${caller}`;
    const now = Date.now();
    const current = this.hits.get(key);

    if (!current || current.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + options.windowMs });
      this.prune(now);
      return true;
    }
    current.count += 1;
    if (current.count > options.max) {
      const seconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      throw new HttpException(
        `Too many requests. Try again in ${seconds}s.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private prune(now: number): void {
    if (this.hits.size <= 2048) {
      return;
    }
    for (const [key, value] of this.hits.entries()) {
      if (value.resetAt <= now) {
        this.hits.delete(key);
      }
    }
  }
}

function clientIp(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.ip ?? request.socket.remoteAddress ?? 'unknown';
}
