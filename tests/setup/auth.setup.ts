import { test as setup } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth';
import {
  ensureAuthStorageDir,
  resolveAuthStorageStatePath,
} from '../shared/auth-state';

setup('authenticate', async ({ page }) => {
  await loginAsTestUser(page);
  ensureAuthStorageDir();
  await page.context().storageState({ path: resolveAuthStorageStatePath() });
});
