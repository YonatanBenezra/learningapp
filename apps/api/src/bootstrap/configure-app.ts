import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { json, raw, urlencoded } from 'express';
import type { Request } from 'express';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { RequestIdInterceptor } from '../common/interceptors/request-id.interceptor';
import type { Env } from '../core/config/env.schema';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService<Env, true>);
  const prefix = config.get('API_PREFIX', { infer: true });
  app.use(`/${prefix}/billing/webhook`, raw({ type: 'application/json' }));
  app.use(
    json({
      verify: (request: Request & { rawBody?: Buffer }, _res, buf) => {
        request.rawBody = buf;
      },
    }),
  );
  app.use(urlencoded({ extended: true }));
  app.setGlobalPrefix(prefix);
  app.use(cookieParser());
  const origins = config
    .get('CORS_ORIGINS', { infer: true })
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());
}
