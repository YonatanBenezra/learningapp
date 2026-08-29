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
  SANDBOX_IMAGE: z.string().default('labpath-sandbox:local'),
  SANDBOX_MAX_MEMORY_MB: z.coerce.number().default(512),
  SANDBOX_MAX_WALL_CLOCK_S: z.coerce.number().default(30),
  SANDBOX_GATEWAY_URL: z
    .string()
    .default('http://sandbox-gateway:8080'),
  SANDBOX_DOCKER_NETWORK: z.string().default('labpath_sandbox'),
  SANDBOX_ALLOW_RUNC_FALLBACK: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type Env = z.infer<typeof envSchema>;
