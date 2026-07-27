import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    MONGO_URI: z.string().min(1).default('mongodb://localhost:27017/b2c'),
    REDIS_URL: z.string().default('redis://localhost:6379'),
    REDIS_ENABLED: z
      .string()
      .default('true')
      .transform((value) => !['false', '0', 'off', 'no'].includes(value.toLowerCase())),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),

    JWT_ACCESS_SECRET: z.string().default(''),
    JWT_REFRESH_SECRET: z.string().default(''),

    GOOGLE_CLIENT_ID: z.string().default(''),

    /** @deprecated Use OPENROUTER_API_KEY. Kept as fallback for existing deployments. */
    AI_PROVIDER_API_KEY: z.string().default(''),
    OPENROUTER_API_KEY: z.string().default(''),
    OPENROUTER_MODEL: z.string().default('anthropic/claude-sonnet-4'),
    OPENROUTER_APP_URL: z.string().default('http://localhost:3000'),
    OPENROUTER_APP_NAME: z.string().default('Bina B2C'),

    SANDBOX_EXECUTION_PROVIDER: z
      .enum(['docker-local', 'firecracker', 'third-party'])
      .default('docker-local'),
    SANDBOX_EXECUTION_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
    SANDBOX_MAX_MEMORY_MB: z.coerce.number().int().positive().default(256),
    SANDBOX_CPUS: z.coerce.number().positive().default(0.5),
    SANDBOX_PIDS_LIMIT: z.coerce.number().int().positive().default(64),
    SANDBOX_MAX_OUTPUT_BYTES: z.coerce.number().int().positive().default(65_536),
    LAB_CODE_MAX_BYTES: z.coerce.number().int().positive().default(65_536),

    EMAIL_PROVIDER_API_KEY: z.string().default(''),

    ACCOUNT_PURGE_WINDOW_DAYS: z.coerce.number().int().positive().default(30),

    SENTRY_DSN: z.string().default(''),

    STRIPE_SECRET_KEY: z.string().default(''),
    STRIPE_WEBHOOK_SECRET: z.string().default(''),
    STRIPE_PRICE_ID: z.string().default(''),
    STRIPE_STANDARD_PRICE_ID: z.string().default(''),
    STRIPE_SUCCESS_URL: z.string().default('http://localhost:3000/billing/success'),
    STRIPE_CANCEL_URL: z.string().default('http://localhost:3000/billing/cancel'),

    /** Comma-separated emails auto-promoted to admin on server boot (user must exist). */
    BOOTSTRAP_ADMIN_EMAILS: z.string().default(''),
    /** Comma-separated emails auto-promoted to instructor on server boot (user must exist). */
    BOOTSTRAP_INSTRUCTOR_EMAILS: z.string().default(''),

    /** Cookie path prefix (use `/api` when Next.js proxies API on same origin). */
    AUTH_COOKIE_PATH: z.string().default('/api'),

    CLOUDINARY_CLOUD_NAME: z.string().default(''),
    CLOUDINARY_API_KEY: z.string().default(''),
    CLOUDINARY_API_SECRET: z.string().default(''),
  })
  // Secrets that are optional in dev/test but MUST be present in production.
  .superRefine((val, ctx) => {
    if (val.NODE_ENV !== 'production') return;
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
      if (!val[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required in production`,
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const data = parsed.data;
const isProd = data.NODE_ENV === 'production';

export const env = {
  nodeEnv: data.NODE_ENV,
  isProd,
  isDev: data.NODE_ENV === 'development',
  isTest: data.NODE_ENV === 'test',
  port: data.PORT,
  logLevel: data.LOG_LEVEL,
  mongoUri: data.MONGO_URI,
  redisUrl: data.REDIS_URL,
  redisEnabled: data.REDIS_ENABLED,
  corsOrigin: data.CORS_ORIGIN,
  // In prod these are guaranteed non-empty by superRefine; in dev/test fall back to a dev secret.
  jwtAccessSecret: data.JWT_ACCESS_SECRET || (isProd ? '' : 'dev-access-secret'),
  jwtRefreshSecret: data.JWT_REFRESH_SECRET || (isProd ? '' : 'dev-refresh-secret'),
  googleClientId: data.GOOGLE_CLIENT_ID,
  aiProviderApiKey: data.OPENROUTER_API_KEY || data.AI_PROVIDER_API_KEY,
  openRouterApiKey: data.OPENROUTER_API_KEY || data.AI_PROVIDER_API_KEY,
  openRouterModel: data.OPENROUTER_MODEL,
  openRouterAppUrl: data.OPENROUTER_APP_URL,
  openRouterAppName: data.OPENROUTER_APP_NAME,
  sandboxProvider: data.SANDBOX_EXECUTION_PROVIDER,
  sandboxTimeoutMs: data.SANDBOX_EXECUTION_TIMEOUT_MS,
  sandboxMaxMemoryMb: data.SANDBOX_MAX_MEMORY_MB,
  sandboxCpus: data.SANDBOX_CPUS,
  sandboxPidsLimit: data.SANDBOX_PIDS_LIMIT,
  sandboxMaxOutputBytes: data.SANDBOX_MAX_OUTPUT_BYTES,
  labCodeMaxBytes: data.LAB_CODE_MAX_BYTES,
  emailProviderApiKey: data.EMAIL_PROVIDER_API_KEY,
  accountPurgeWindowDays: data.ACCOUNT_PURGE_WINDOW_DAYS,
  sentryDsn: data.SENTRY_DSN,
  stripeSecretKey: data.STRIPE_SECRET_KEY,
  stripeWebhookSecret: data.STRIPE_WEBHOOK_SECRET,
  stripePriceId: data.STRIPE_PRICE_ID,
  stripeStandardPriceId: data.STRIPE_STANDARD_PRICE_ID,
  stripeSuccessUrl: data.STRIPE_SUCCESS_URL,
  stripeCancelUrl: data.STRIPE_CANCEL_URL,
  bootstrapAdminEmails: data.BOOTSTRAP_ADMIN_EMAILS,
  bootstrapInstructorEmails: data.BOOTSTRAP_INSTRUCTOR_EMAILS,
  authCookiePath: data.NODE_ENV === 'test' ? '/' : data.AUTH_COOKIE_PATH,
  authCookieSecure: data.NODE_ENV === 'production',
  authCookieSameSite: 'lax' as const,
  cloudinaryCloudName: data.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: data.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: data.CLOUDINARY_API_SECRET,
} as const;
