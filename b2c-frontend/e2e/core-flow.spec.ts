import { test, expect } from '@playwright/test';
import {
  isBackendHealthy,
  loginViaApi,
  seedAuthSession,
  signupViaApi,
  uniqueEmail,
} from './helpers';

const runFlow = process.env.E2E_API_URL || process.env.CI === 'true';

test.describe('Core learner flow', () => {
  test.skip(!runFlow, 'Set E2E_API_URL to run against a live backend');

  test('signup → dashboard → courses → settings', async ({ page }) => {
    test.setTimeout(120_000);

    const healthy = await isBackendHealthy();
    test.skip(!healthy, 'Backend is not reachable');

    const email = process.env.E2E_EMAIL ?? uniqueEmail();
    const password = process.env.E2E_PASSWORD ?? 'TestPass123!';

    const auth = process.env.E2E_EMAIL
      ? await loginViaApi(email, password)
      : await signupViaApi(email, password);

    await seedAuthSession(page, auth);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Good morning|Good afternoon|Good evening|শুভ/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('link', { name: /Courses|কোর্স/i }).click();
    await expect(page).toHaveURL(/\/my-courses/);

    await page.getByRole('link', { name: /Settings|সেটিংস/i }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('main').getByRole('heading', { name: /Settings|সেটিংস/i })).toBeVisible();
  });

  test('authenticated user can open quiz history', async ({ page }) => {
    test.setTimeout(60_000);

    const healthy = await isBackendHealthy();
    test.skip(!healthy, 'Backend is not reachable');

    const email = process.env.E2E_EMAIL ?? uniqueEmail();
    const password = process.env.E2E_PASSWORD ?? 'TestPass123!';

    const auth = process.env.E2E_EMAIL
      ? await loginViaApi(email, password)
      : await signupViaApi(email, password);

    await seedAuthSession(page, auth);
    await page.goto('/quizzes');
    await expect(page.getByRole('heading', { name: /Quiz history|কুইজ ইতিহাস/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
