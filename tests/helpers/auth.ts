import { expect, type Page } from '@playwright/test';
import { requireTestCredentials } from './env';

/**
 * Performs UI login and waits until the post-login home URL is stable.
 * Used by auth setup; can be reused by specs that must re-authenticate.
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  const { username, password } = requireTestCredentials();

  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);

  await Promise.all([
    page.waitForURL('**/home/'),
    page.locator('button[type="submit"]').click(),
  ]);

  await expect(page).toHaveURL(/\/home\/$/);
}
