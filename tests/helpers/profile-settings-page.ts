import { expect, type Locator, type Page } from '@playwright/test';

import { authenticatedApiRequest } from './api';

import {
  PROFILE_FIELD_VALIDATION_MESSAGES,
  PROFILE_SETTINGS_FORBIDDEN_LABEL_CASING,
  PROFILE_SETTINGS_REQUIRED_FIELD_LABELS,
  PROFILE_SETTINGS_VISIBLE_LABELS,
  globalMessageSnackbar,
  profileFieldValidationMessage,
  profileFirstNameField,
  profileLanguageOptionEnglish,
  profileLanguageOptionFrench,
  profileLanguagePreferenceGroup,
  profileLastNameField,
  profileSettingsForm,
  profileSettingsRequiredFieldLabel,
  profileSettingsTitle,
  profileSettingsVisibleLabel,
  profileUpdateButton,
  profileUsernameField,
  waitForProfileSettingsLoaded,
} from '../e2e/user/user.locators';
import { gotoAuthenticatedShell } from './navigation';

export type ProfileSettingsApiItem = {
  email: string;
  firstName: string;
  lastName: string;
  languagePreference: string;
};

export async function gotoProfileSettingsPage(page: Page): Promise<void> {
  await gotoAuthenticatedShell(page, '/user/profile-settings');
  await waitForProfileSettingsLoaded(page);
}

export async function fetchMyProfileSettings(page: Page): Promise<ProfileSettingsApiItem> {
  const path = '/api/user/me/profile-settings';
  const response = await authenticatedApiRequest(page, 'GET', path);
  expect(response.ok(), `${path} returned HTTP ${response.status()}`).toBeTruthy();
  const body = (await response.json()) as { item: ProfileSettingsApiItem };
  return body.item;
}

/** FR-PROFILE-001 — visible labels use sentence case; forbidden title-case variants absent. */
export async function expectProfileSettingsVisibleLabelsPerFrProfile001(page: Page): Promise<void> {
  await expect(
    profileSettingsVisibleLabel(page, PROFILE_SETTINGS_VISIBLE_LABELS.firstName),
  ).toBeVisible();
  await expect(
    profileSettingsVisibleLabel(page, PROFILE_SETTINGS_VISIBLE_LABELS.lastName),
  ).toBeVisible();
  await expect(
    profileSettingsVisibleLabel(page, PROFILE_SETTINGS_VISIBLE_LABELS.languagePreferences),
  ).toBeVisible();

  for (const forbiddenLabel of PROFILE_SETTINGS_FORBIDDEN_LABEL_CASING) {
    await expect(profileSettingsForm(page).getByText(forbiddenLabel, { exact: true })).toHaveCount(0);
  }

  for (const requiredLabel of PROFILE_SETTINGS_REQUIRED_FIELD_LABELS) {
    await expect(profileSettingsRequiredFieldLabel(page, requiredLabel)).toBeVisible();
  }
}

/** FR-PROFILE-001 — route, title, form fields, username read-only, sentence-case labels. */
export async function expectProfileSettingsPrimaryLayoutPerFrProfile001(page: Page): Promise<void> {
  await waitForProfileSettingsLoaded(page);
  await expect(page).toHaveURL(/\/user\/profile-settings\/?$/);
  await expect(profileSettingsTitle(page)).toHaveText('Profile settings');
  await expect(profileSettingsForm(page)).toBeVisible();
  await expectProfileSettingsVisibleLabelsPerFrProfile001(page);
  await expect(profileUsernameField(page)).toBeVisible();
  await expect(profileUsernameField(page)).toBeDisabled();
  await expect(profileFirstNameField(page)).toBeVisible();
  await expect(profileFirstNameField(page)).toBeEditable();
  await expect(profileLastNameField(page)).toBeVisible();
  await expect(profileLastNameField(page)).toBeEditable();
  await expect(profileLanguagePreferenceGroup(page)).toBeVisible();
  await expect(profileLanguagePreferenceGroup(page)).toBeEditable();
  await expect(profileUpdateButton(page)).toBeVisible();
  await expect(profileUpdateButton(page)).toHaveText('Update profile');
  await expectProfileSettingsFieldOrderPerFrProfile001(page);
}

/** FR-PROFILE-001 — username, first name, last name, language group, update button order. */
export async function expectProfileSettingsFieldOrderPerFrProfile001(page: Page): Promise<void> {
  const orderedFields: Locator[] = [
    profileUsernameField(page),
    profileFirstNameField(page),
    profileLastNameField(page),
    profileLanguagePreferenceGroup(page),
    profileUpdateButton(page),
  ];

  const boxes = await Promise.all(orderedFields.map((field) => field.boundingBox()));
  for (let index = 1; index < boxes.length; index += 1) {
    expect(boxes[index]?.y ?? 0).toBeGreaterThanOrEqual(boxes[index - 1]?.y ?? 0);
  }
}

/** FR-PROFILE-002 — loaded values match API profile settings. */
export async function expectProfileSettingsLoadedValuesPerFrProfile002(
  page: Page,
  profile: ProfileSettingsApiItem,
): Promise<void> {
  await expect(profileUsernameField(page)).toHaveValue(profile.email);
  await expect(profileFirstNameField(page)).toHaveValue(profile.firstName);
  await expect(profileLastNameField(page)).toHaveValue(profile.lastName);

  if (profile.languagePreference === 'en') {
    await expect(profileLanguageOptionEnglish(page)).toBeChecked();
  } else if (profile.languagePreference === 'fr') {
    await expect(profileLanguageOptionFrench(page)).toBeChecked();
  } else {
    throw new Error(`Unexpected languagePreference: ${profile.languagePreference}`);
  }
}

/** FR-PROFILE-003 — no field validation messages before interaction. */
export async function expectNoProfileFieldValidationMessages(page: Page): Promise<void> {
  for (const message of Object.values(PROFILE_FIELD_VALIDATION_MESSAGES)) {
    await expect(profileFieldValidationMessage(page, message)).toHaveCount(0);
  }
}

export function profileNameAtMaxLength(prefix: string): string {
  const maxLength = 200;
  if (prefix.length >= maxLength) {
    return prefix.slice(0, maxLength);
  }
  return `${prefix}${'x'.repeat(maxLength - prefix.length)}`;
}

/** FR-PROFILE-005 — globalMessageSnackbar shows exact requirement copy. */
export async function expectProfileSettingsSnackbarMessage(
  page: Page,
  message: string,
): Promise<void> {
  await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
  await expect(globalMessageSnackbar(page)).toHaveText(message, { exact: true });
}

export function alternateProfileLanguagePreference(
  languagePreference: string,
): 'en' | 'fr' {
  return languagePreference === 'en' ? 'fr' : 'en';
}

export function profileLanguageOptionForPreference(
  page: Page,
  languagePreference: 'en' | 'fr',
) {
  return languagePreference === 'en'
    ? profileLanguageOptionEnglish(page)
    : profileLanguageOptionFrench(page);
}
