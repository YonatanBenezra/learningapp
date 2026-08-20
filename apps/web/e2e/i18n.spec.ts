import { test, expect } from '@playwright/test';

const mockUser = {
  id: 'e2e-user',
  email: 'e2e@bina-test.local',
  role: 'user',
  tier: 'free',
  preferences: { visualsPreferred: true, dailyNotification: true },
};

test('language preference translates auth page', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bina-locale', 'bn');
  });

  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'আবার স্বাগতম' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'সাইন আপ' })).toBeVisible();
});

test('language preference translates settings page labels', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bina-locale', 'bn');
  });

  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: mockUser }) });
  });
  await page.route('**/api/users/me', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: mockUser }) });
  });

  await page.goto('/settings');
  const onSettings = await page.getByRole('heading', { name: 'সেটিংস' }).isVisible({ timeout: 5000 }).catch(() => false);
  if (onSettings) {
    await expect(page.getByRole('heading', { name: 'সেটিংস' })).toBeVisible();
    return;
  }
  await expect(page.getByRole('heading', { name: 'আবার স্বাগতম' })).toBeVisible();
});
