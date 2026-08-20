import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    // These are integration tests against ONE shared Redis + Mongo. Running files
    // in parallel lets one file's rate-limit-key cleanup (rl:*) reset another
    // file's IP-based limiter counter mid-test. Serialize files to isolate shared
    // external state; within a file, tests still run sequentially.
    fileParallelism: false,
    // Global afterEach clears shared rate-limit keys between tests (see setup.ts).
    setupFiles: ['tests/setup.ts'],
    // Dummy Stripe config so subscription code paths are exercisable without real
    // keys. Signature verification is local (crypto) and makes no network call;
    // billing happy-paths inject a fake provider.
    env: {
      STRIPE_SECRET_KEY: 'sk_test_dummy',
      STRIPE_WEBHOOK_SECRET: 'whsec_test_dummy',
      STRIPE_PRICE_ID: 'price_test_dummy',
    },
  },
});
