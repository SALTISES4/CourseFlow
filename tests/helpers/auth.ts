import { expect, type Page } from '@playwright/test';
import { requireTestCredentials } from './env';

export type LoginCredentials = {
  email: string;
  password: string;
};

/**
 * Performs UI login and waits until the post-login home URL is stable.
 */
export async function loginAs(page: Page, credentials: LoginCredentials): Promise<void> {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole('button', { name: /^Login$/i }).click();
  await expect(page).toHaveURL(/\/home\/?$/, { timeout: 15_000 });
}

/**
 * Default test user from tests/.env (owner / admin).
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  const { username, password } = requireTestCredentials();
  await loginAs(page, { email: username, password });
}
