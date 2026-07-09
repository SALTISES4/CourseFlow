import { test, expect } from '@playwright/test';
import {
  alternateProfileLanguagePreference,
  expectNoProfileFieldValidationMessages,
  expectProfileSettingsLoadedValuesPerFrProfile002,
  expectProfileSettingsPrimaryLayoutPerFrProfile001,
  expectProfileSettingsVisibleLabelsPerFrProfile001,
  expectProfileSettingsSnackbarMessage,
  fetchMyProfileSettings,
  gotoProfileSettingsPage,
  profileLanguageOptionForPreference,
  profileNameAtMaxLength,
} from '../../helpers/profile-settings-page';
import {
  PROFILE_FIELD_VALIDATION_MESSAGES,
  PROFILE_SETTINGS_API_ROUTE,
  PROFILE_SETTINGS_SNACKBAR_MESSAGES,
  globalMessageSnackbar,
  profileFieldValidationMessage,
  profileFirstNameField,
  profileLanguageOptionEnglish,
  profileLanguageOptionFrench,
  profileLanguagePreferenceGroup,
  profileLastNameField,
  profileUpdateButton,
  profileUsernameField,
} from './user.locators';

/**
 * Calibration slice — FR-PROFILE-001 through FR-PROFILE-005.
 * Requirements: tests/docs/requirements/features/user/profile_settings_requirements_v1.yaml
 * Auth: chromium project storage state (admin@courseflow.com).
 */

test.describe('Profile settings — calibration (FR-PROFILE-001–005)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await gotoProfileSettingsPage(page);
  });

  test('FR-PROFILE-001: visible labels use sentence case with required-field markers', async ({
    page,
  }) => {
    await expectProfileSettingsVisibleLabelsPerFrProfile001(page);
  });

  test('FR-PROFILE-001: route renders primary form elements', async ({ page }) => {
    await expect(page).toHaveURL(/\/user\/profile-settings\/?$/);
    await expectProfileSettingsPrimaryLayoutPerFrProfile001(page);
  });

  test('FR-PROFILE-002: form loads with profile values from API', async ({ page }) => {
    const profile = await fetchMyProfileSettings(page);
    await expectProfileSettingsLoadedValuesPerFrProfile002(page, profile);
    await expect(profileUsernameField(page)).toBeDisabled();
    await expect(profileFirstNameField(page)).toBeEditable();
    await expect(profileLastNameField(page)).toBeEditable();
    await expect(profileLanguagePreferenceGroup(page)).toBeVisible();
  });

  test('FR-PROFILE-004: language preference offers English and French only', async ({ page }) => {
    await expect(profileLanguageOptionEnglish(page)).toBeVisible();
    await expect(profileLanguageOptionFrench(page)).toBeVisible();
    await expect(profileLanguageOptionEnglish(page)).toHaveAttribute('value', 'en');
    await expect(profileLanguageOptionFrench(page)).toHaveAttribute('value', 'fr');
    await expect(page.getByRole('radio')).toHaveCount(2);
  });

  test.describe('FR-PROFILE-003: field validation', () => {
    test('no validation messages before form interaction', async ({ page }) => {
      await expectNoProfileFieldValidationMessages(page);
    });

    test('first name required message after cleared submit', async ({ page }) => {
      const baselineFirst = `E2EFirst${Date.now()}`;
      const baselineLast = `E2ELast${Date.now()}`;

      await profileFirstNameField(page).fill(baselineFirst);
      await profileLastNameField(page).fill(baselineLast);
      await profileUpdateButton(page).click();
      await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });

      await profileFirstNameField(page).fill('');
      await profileUpdateButton(page).click();
      await expect(
        profileFieldValidationMessage(page, PROFILE_FIELD_VALIDATION_MESSAGES.firstNameRequired),
      ).toBeVisible();
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
      await expect(
        profileFieldValidationMessage(page, PROFILE_FIELD_VALIDATION_MESSAGES.lastNameRequired),
      ).toBeVisible();
    });

    test('first name limited to 200 characters', async ({ page }) => {
      await profileFirstNameField(page).fill(profileNameAtMaxLength('E2E'));
      await profileUpdateButton(page).click();
      await expect(
        profileFieldValidationMessage(page, PROFILE_FIELD_VALIDATION_MESSAGES.firstNameMaxLength),
      ).toBeVisible();
    });

    test('last name limited to 200 characters', async ({ page }) => {
      await profileLastNameField(page).fill(profileNameAtMaxLength('E2E'));
      await profileUpdateButton(page).click();
      await expect(
        profileFieldValidationMessage(page, PROFILE_FIELD_VALIDATION_MESSAGES.lastNameMaxLength),
      ).toBeVisible();
    });
  });

  test.describe('FR-PROFILE-005: submit behavior and feedback', () => {
    test('update button stays disabled until dirty; save shows success snackbar', async ({
      page,
    }) => {
      const updatedFirst = `E2E ${Date.now()}`.slice(0, 200);
      const updatedLast = `User ${Date.now()}`.slice(0, 200);

      await expect(profileUpdateButton(page)).toBeDisabled();

      await profileFirstNameField(page).fill(updatedFirst);
      await profileLastNameField(page).fill(updatedLast);
      await expect(profileUpdateButton(page)).toBeEnabled();

      await profileUpdateButton(page).click();

      await expectProfileSettingsSnackbarMessage(
        page,
        PROFILE_SETTINGS_SNACKBAR_MESSAGES.success,
      );
      await expect(profileFirstNameField(page)).toHaveValue(updatedFirst);
      await expect(profileLastNameField(page)).toHaveValue(updatedLast);
    });

    test('language preference saves and persists after successful submit', async ({ page }) => {
      const profile = await fetchMyProfileSettings(page);
      const targetLanguage = alternateProfileLanguagePreference(profile.languagePreference);
      const targetLanguageOption = profileLanguageOptionForPreference(page, targetLanguage);

      await targetLanguageOption.click();
      await expect(profileUpdateButton(page)).toBeEnabled();
      await profileUpdateButton(page).click();

      await expectProfileSettingsSnackbarMessage(
        page,
        PROFILE_SETTINGS_SNACKBAR_MESSAGES.success,
      );
      await expect(targetLanguageOption).toBeChecked();

      const savedProfile = await fetchMyProfileSettings(page);
      expect(savedProfile.languagePreference).toBe(targetLanguage);
      await expectProfileSettingsLoadedValuesPerFrProfile002(page, savedProfile);
    });

    test('server failure shows snackbar and retains field values', async ({ page }) => {
      const profile = await fetchMyProfileSettings(page);
      const targetLanguage = alternateProfileLanguagePreference(profile.languagePreference);
      const targetLanguageOption = profileLanguageOptionForPreference(page, targetLanguage);
      const updatedFirst = `E2E Fail ${Date.now()}`.slice(0, 200);
      const updatedLast = `User Fail ${Date.now()}`.slice(0, 200);

      await page.route(PROFILE_SETTINGS_API_ROUTE, (route) => {
        if (route.request().method() !== 'PATCH') {
          void route.continue();
          return;
        }

        void route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'E2E simulated profile settings failure' }),
        });
      });

      await profileFirstNameField(page).fill(updatedFirst);
      await profileLastNameField(page).fill(updatedLast);
      await targetLanguageOption.click();
      await profileUpdateButton(page).click();

      await expectProfileSettingsSnackbarMessage(
        page,
        PROFILE_SETTINGS_SNACKBAR_MESSAGES.failure,
      );
      await expect(profileFirstNameField(page)).toHaveValue(updatedFirst);
      await expect(profileLastNameField(page)).toHaveValue(updatedLast);
      await expect(profileUsernameField(page)).toHaveValue(profile.email);
      await expect(targetLanguageOption).toBeChecked();
      await expect(
        profileLanguageOptionForPreference(
          page,
          alternateProfileLanguagePreference(targetLanguage),
        ),
      ).not.toBeChecked();
    });
  });
});
