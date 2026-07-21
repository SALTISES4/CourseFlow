import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Locators for user settings pages — aligned with
 * tests/docs/requirements/features/shared/canonical_locators.yaml (profile*, notificationsSettings*).
 */

export const PROFILE_SETTINGS_TITLE = 'Profile settings';
export const PROFILE_SETTINGS_VISIBLE_LABELS = {
  emailUsername: 'Email / Username',
  firstName: 'First name',
  lastName: 'Last name',
  languagePreferences: 'Language preferences',
} as const;
/** Wrong title-case labels that must not appear per FR-PROFILE-001 sentence-case rule. */
export const PROFILE_SETTINGS_FORBIDDEN_LABEL_CASING = [
  'First Name',
  'Last Name',
  'Language Preferences',
] as const;
export const PROFILE_SETTINGS_SNACKBAR_MESSAGES = {
  success: 'Your profile settings have been updated',
  failure:
    'We encountered an issue and your profile settings have not been updated',
} as const;
export const PROFILE_FIELD_VALIDATION_MESSAGES = {
  firstNameRequired: 'First name is required',
  lastNameRequired: 'Last name is required',
  firstNameMaxLength: 'First name is limited to 200 characters',
  lastNameMaxLength: 'Last name is limited to 200 characters',
} as const;
export const PROFILE_SETTINGS_API_ROUTE = '**/api/user/me/profile-settings';
export const NOTIFICATIONS_SETTINGS_TITLE = 'Notification settings';
export const NOTIFICATIONS_SETTINGS_API_ROUTE =
  '**/api/user/me/notification-settings';
export const NOTIFICATIONS_SETTINGS_SNACKBAR_MESSAGES = {
  success: 'Your notification settings have been updated',
  failure:
    'We encountered an issue and your notification settings were not updated',
} as const;
export const PASSWORD_RESET_TITLE = 'Password reset';
export const PASSWORD_NEW_PASSWORD_GUIDELINES =
  'Your password must contain at least 12 characters and include a mix of numbers, letters and symbols';
export const PASSWORD_RESET_VALIDATION_MESSAGES = {
  currentRequired: 'Current password is required',
  newRequired: 'New password is required',
  confirmRequired: 'Confirm new password is required',
  passwordsDoNotMatch: 'Passwords do not match',
  newMustDiffer: 'New password must be different from your current password',
  currentIncorrect: 'Current password is incorrect',
} as const;
export const PASSWORD_RESET_SNACKBAR_MESSAGES = {
  success: 'Your password has been successfully reset',
  failure: 'We encountered an issue and your password was not reset',
} as const;
export const PASSWORD_RESET_API_ROUTE = '**/api/user/me/password-reset';
export const PRODUCT_UPDATES_TOGGLE_LABEL =
  'I want to receive product updates emails';

export function profileSettingsTitle(page: Page): Locator {
  return page.getByRole('heading', {
    name: PROFILE_SETTINGS_TITLE,
    exact: true,
  });
}

export function profileSettingsForm(page: Page): Locator {
  return page
    .locator('form')
    .filter({ has: page.getByRole('button', { name: 'Update profile' }) });
}

export function profileUsernameField(page: Page): Locator {
  return profileSettingsForm(page).getByRole('textbox', {
    name: PROFILE_SETTINGS_VISIBLE_LABELS.emailUsername,
    exact: true,
  });
}

export function profileFirstNameField(page: Page): Locator {
  return profileSettingsForm(page).getByRole('textbox', {
    name: PROFILE_SETTINGS_VISIBLE_LABELS.firstName,
    exact: true,
  });
}

export function profileLastNameField(page: Page): Locator {
  return profileSettingsForm(page).getByRole('textbox', {
    name: PROFILE_SETTINGS_VISIBLE_LABELS.lastName,
    exact: true,
  });
}

export function profileLanguagePreferenceGroup(page: Page): Locator {
  return profileSettingsForm(page).getByRole('group', {
    name: PROFILE_SETTINGS_VISIBLE_LABELS.languagePreferences,
    exact: true,
  });
}

/** Visible label or legend text on profileSettingsForm (not accessibility-name inference). */
export function profileSettingsVisibleLabel(
  page: Page,
  label: string,
): Locator {
  return profileSettingsForm(page)
    .locator('label, legend')
    .filter({ hasText: label });
}

export function profileLanguageOptionEnglish(page: Page): Locator {
  return page.getByRole('radio', { name: 'English', exact: true });
}

export function profileLanguageOptionFrench(page: Page): Locator {
  return page.getByRole('radio', { name: 'French', exact: true });
}

export function profileUpdateButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Update profile', exact: true });
}

export function profileFieldValidationMessage(
  page: Page,
  message: string,
): Locator {
  return profileSettingsForm(page).getByText(message, { exact: true });
}

export function passwordResetTitle(page: Page): Locator {
  return page.getByRole('heading', { name: PASSWORD_RESET_TITLE, exact: true });
}

export function passwordResetForm(page: Page): Locator {
  return page.locator('form').filter({
    has: page.getByRole('button', { name: 'Reset password', exact: true }),
  });
}

export function currentPasswordField(page: Page): Locator {
  return page.getByLabel(/^Current password/);
}

export function newPasswordField(page: Page): Locator {
  return page.getByLabel(/^New password/);
}

export function confirmNewPasswordField(page: Page): Locator {
  return page.getByLabel(/^Confirm new password/);
}

export function passwordNewPasswordGuidelines(page: Page): Locator {
  return page.getByText(PASSWORD_NEW_PASSWORD_GUIDELINES, { exact: true });
}

export function passwordResetSubmitButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Reset password', exact: true });
}

export function passwordResetFieldValidationMessage(
  page: Page,
  message: string,
): Locator {
  return passwordResetForm(page).getByText(message, { exact: true });
}

export function notificationsSettingsTitle(page: Page): Locator {
  return page.getByRole('heading', {
    name: NOTIFICATIONS_SETTINGS_TITLE,
    exact: true,
  });
}

export function notificationsSettingsForm(page: Page): Locator {
  return page.locator('form').filter({
    has: page.getByRole('checkbox', { name: PRODUCT_UPDATES_TOGGLE_LABEL }),
  });
}

export function productUpdatesToggle(page: Page): Locator {
  return page.getByRole('checkbox', { name: PRODUCT_UPDATES_TOGGLE_LABEL });
}

export { globalMessageSnackbar } from '../../shared/locators/global';

export async function waitForPasswordResetPageLoaded(
  page: Page,
): Promise<void> {
  await expect(page.locator('.load-screen')).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(passwordResetTitle(page)).toBeVisible({ timeout: 15_000 });
  await expect(passwordResetForm(page)).toBeVisible();
}

export async function waitForProfileSettingsLoaded(page: Page): Promise<void> {
  await expect(page.locator('.load-screen')).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(profileSettingsTitle(page)).toBeVisible({ timeout: 15_000 });
  await expect(profileSettingsForm(page)).toBeVisible();
}

export async function waitForNotificationsSettingsLoaded(
  page: Page,
): Promise<void> {
  await expect(notificationsSettingsTitle(page)).toBeVisible({
    timeout: 15_000,
  });
  await expect(productUpdatesToggle(page)).toBeVisible();
}
