import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class IngestSignatureGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('INGEST_SIGNING_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Ingest signing secret is not configured');
    }

    const request = context.switchToHttp().getRequest<Request & { rawBody?: Buffer }>();
    const provided = request.headers['x-ingest-signature'];
    if (typeof provided !== 'string' || provided.length === 0) {
      throw new UnauthorizedException('Missing ingest signature');
    }

    const body =
      request.rawBody ??
      Buffer.from(
        typeof request.body === 'string'
          ? request.body
          : JSON.stringify(request.body ?? {}),
        'utf8',
      );
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    const providedBuffer = Buffer.from(provided, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid ingest signature');
    }
    return true;
  }
}
