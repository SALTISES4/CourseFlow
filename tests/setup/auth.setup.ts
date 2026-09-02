import { test as setup } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth';
import {
  fetchMyProfileSettings,
  patchMyProfileSettings,
} from '../helpers/profile-settings-page';
import {
  ensureAuthStorageDir,
  resolveAuthStorageStatePath,
} from '../shared/auth-state';

setup('authenticate', async ({ page }) => {
  await loginAsTestUser(page);
  const profile = await fetchMyProfileSettings(page);
  if (profile.languagePreference !== 'en') {
    await patchMyProfileSettings(page, {
      ...profile,
      languagePreference: 'en',
    });
  }
  ensureAuthStorageDir();
  await page.context().storageState({ path: resolveAuthStorageStatePath() });
});
