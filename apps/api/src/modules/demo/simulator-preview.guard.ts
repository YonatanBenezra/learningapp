import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

@Injectable()
export class SimulatorPreviewGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = clientKey(request);
    const now = Date.now();
    const current = this.hits.get(key);

    if (!current || current.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
      this.prune(now);
      return true;
    }

    current.count += 1;
    if (current.count > MAX_REQUESTS) {
      throw new HttpException(
        'Too many preview runs. Wait a minute and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private prune(now: number): void {
    if (this.hits.size <= 512) {
      return;
    }
    for (const [key, value] of this.hits.entries()) {
      if (value.resetAt <= now) {
        this.hits.delete(key);
      }
    }
  }
}

function clientKey(request: Request): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.ip ?? request.socket.remoteAddress ?? 'unknown';
}
