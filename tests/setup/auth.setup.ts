import { test as setup } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth';
import { resolveAuthStorageStatePath } from '../shared/auth-state';

setup('authenticate', async ({ page }) => {
  await loginAsTestUser(page);
  await page.context().storageState({ path: resolveAuthStorageStatePath() });
});
