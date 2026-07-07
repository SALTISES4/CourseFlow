import { test, expect } from '@playwright/test';
import { gotoAuthenticatedShell } from '../../helpers/navigation';
import {
  globalMessageSnackbar,
  profileFirstNameField,
  profileLanguageOptionEnglish,
  profileLanguageOptionFrench,
  profileLanguagePreferenceGroup,
  profileLastNameField,
  profileSettingsForm,
  profileSettingsTitle,
  profileUpdateButton,
  profileUsernameField,
  waitForProfileSettingsLoaded,
} from './user.locators';

/**
 * Calibration slice — FR-PROFILE-001 through FR-PROFILE-005.
 * Requirements: tests/docs/requirements/features/user/profile_settings_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com).
 */

test.describe('Profile settings — calibration (FR-PROFILE-001-005)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await gotoAuthenticatedShell(page, '/user/profile-settings');
    await waitForProfileSettingsLoaded(page);
  });

  test('FR-PROFILE-001: route renders primary form elements', async ({ page }) => {
    await expect(page).toHaveURL(/\/user\/profile-settings\/?$/);
    await expect(profileSettingsTitle(page)).toBeVisible();
    await expect(profileSettingsForm(page)).toBeVisible();
    await expect(profileFirstNameField(page)).toBeVisible();
    await expect(profileLastNameField(page)).toBeVisible();
    await expect(profileLanguagePreferenceGroup(page)).toBeVisible();
    await expect(profileUpdateButton(page)).toBeVisible();

    if ((await profileUsernameField(page).count()) > 0) {
      await expect(profileUsernameField(page)).toBeDisabled();
      return;
    }

    await expect(profileUsernameField(page)).toHaveCount(0);
  });

  test('FR-PROFILE-002: form loads with editable fields and a language selection', async ({ page }) => {
    await expect(profileFirstNameField(page)).toBeEditable();
    await expect(profileLastNameField(page)).toBeEditable();

    const englishChecked = await profileLanguageOptionEnglish(page).isChecked();
    const frenchChecked = await profileLanguageOptionFrench(page).isChecked();
    expect(englishChecked || frenchChecked).toBe(true);
  });

  test('FR-PROFILE-004: language preference offers English and French only', async ({ page }) => {
    await expect(profileLanguageOptionEnglish(page)).toBeVisible();
    await expect(profileLanguageOptionFrench(page)).toBeVisible();
    await expect(profileLanguageOptionEnglish(page)).toHaveAttribute('value', 'en');
    await expect(profileLanguageOptionFrench(page)).toHaveAttribute('value', 'fr');
    await expect(page.getByRole('radio')).toHaveCount(2);
  });

  test.describe('FR-PROFILE-003: field validation', () => {
    test('first name required message after cleared submit', async ({ page }) => {
      const baselineFirst = `E2EFirst${Date.now()}`;
      const baselineLast = `E2ELast${Date.now()}`;

      await profileFirstNameField(page).fill(baselineFirst);
      await profileLastNameField(page).fill(baselineLast);
      await profileUpdateButton(page).click();
      await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });

      await profileFirstNameField(page).fill('');
      await profileUpdateButton(page).click();
      await expect(page.getByText(/First [Nn]ame is required/)).toBeVisible();
    });

    test('last name required message after cleared submit', async ({ page }) => {
      const baselineFirst = `E2EFirst${Date.now()}`;
      const baselineLast = `E2ELast${Date.now()}`;

      await profileFirstNameField(page).fill(baselineFirst);
      await profileLastNameField(page).fill(baselineLast);
      await profileUpdateButton(page).click();
      await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });

      await profileLastNameField(page).fill('');
      await profileUpdateButton(page).click();
      await expect(page.getByText(/Last [Nn]ame is required/)).toBeVisible();
    });
  });

  test('FR-PROFILE-005: update button stays disabled until dirty; save shows snackbar', async ({
    page,
  }) => {
    const updatedFirst = `E2E ${Date.now()}`.slice(0, 200);
    const updatedLast = `User ${Date.now()}`.slice(0, 200);

    await expect(profileUpdateButton(page)).toBeDisabled();

    await profileFirstNameField(page).fill(updatedFirst);
    await profileLastNameField(page).fill(updatedLast);
    await expect(profileUpdateButton(page)).toBeEnabled();

    await profileUpdateButton(page).click();

    await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
    await expect(globalMessageSnackbar(page)).toContainText(
      /User details updated|Your profile settings have been updated/,
    );
    await expect(profileFirstNameField(page)).toHaveValue(updatedFirst);
    await expect(profileLastNameField(page)).toHaveValue(updatedLast);
  });
});
