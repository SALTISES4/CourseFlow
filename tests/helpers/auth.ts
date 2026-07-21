import { expect, type Page } from '@playwright/test';
import { requireTestCredentials } from './env';

const ACCESS_TOKEN_STORAGE_KEY = 'cf2_access_token';

export type LoginCredentials = {
  email: string;
  password: string;
};

/** Performs UI login and waits for the Bearer token and post-login navigation. */
export async function loginAs(page: Page, credentials: LoginCredentials): Promise<void> {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole('button', { name: /^Login$/i }).click();
  await expect
    .poll(
      () =>
        page.evaluate(
          (storageKey) => window.localStorage.getItem(storageKey),
          ACCESS_TOKEN_STORAGE_KEY,
        ),
      { timeout: 15_000 },
    )
    .not.toBeNull();
  await expect(page).not.toHaveURL(/\/login\/?(?:[?#].*)?$/, { timeout: 15_000 });
}

/**
 * Default test user from tests/.env (teacher and E2E fixture owner).
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  const { username, password } = requireTestCredentials();
  await loginAs(page, { email: username, password });
}
