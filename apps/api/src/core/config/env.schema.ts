import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3001),
  API_PREFIX: z.string().default('api'),
  DATABASE_URL: z
    .string()
    .min(1)
    .default(
      'postgresql://labpath:labpath@localhost:5434/labpath?schema=public',
    ),
  DATABASE_URL_WORKER: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).default('redis://localhost:6382'),
  JWT_ACCESS_SECRET: z.string().min(16).default('change-me-access-secret'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16).default('change-me-refresh-secret'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  INGEST_SIGNING_SECRET: z.string().min(16).default('change-me-ingest-secret'),
});

export type Env = z.infer<typeof envSchema>;
