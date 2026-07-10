import { expect, type Page } from '@playwright/test';

import {
  PASSWORD_NEW_PASSWORD_GUIDELINES,
  PASSWORD_RESET_VALIDATION_MESSAGES,
  confirmNewPasswordField,
  currentPasswordField,
  newPasswordField,
  passwordNewPasswordGuidelines,
  passwordResetFieldValidationMessage,
  passwordResetForm,
  passwordResetSubmitButton,
  passwordResetTitle,
  waitForPasswordResetPageLoaded,
} from '../e2e/user/user.locators';
import { gotoAuthenticatedShell } from './navigation';

/** Valid new password per FR-REG-001 / passwordNewPasswordGuidelines. */
export function sampleValidNewPassword(seed = Date.now()): string {
  return `E2E-NewP@ss${seed}!`;
}

export async function gotoPasswordResetPage(page: Page): Promise<void> {
  await gotoAuthenticatedShell(page, '/user/password-reset');
  await waitForPasswordResetPageLoaded(page);
}

/** FR-PWD-001 — password reset page route and primary layout. */
export async function expectPasswordResetPagePrimaryLayoutPerFrPwd001(page: Page): Promise<void> {
  await waitForPasswordResetPageLoaded(page);
  await expect(page).toHaveURL(/\/user\/password-reset\/?$/);
  await expect(passwordResetTitle(page)).toBeVisible();
  await expect(passwordResetForm(page)).toBeVisible();
  await expect(currentPasswordField(page)).toBeVisible();
  await expect(currentPasswordField(page)).toBeEditable();
  await expect(currentPasswordField(page)).toHaveAttribute('type', 'password');
  await expect(newPasswordField(page)).toBeVisible();
  await expect(newPasswordField(page)).toBeEditable();
  await expect(newPasswordField(page)).toHaveAttribute('type', 'password');
  await expect(confirmNewPasswordField(page)).toBeVisible();
  await expect(confirmNewPasswordField(page)).toBeEditable();
  await expect(confirmNewPasswordField(page)).toHaveAttribute('type', 'password');
  await expect(passwordNewPasswordGuidelines(page)).toBeVisible();
  await expect(passwordNewPasswordGuidelines(page)).toHaveText(PASSWORD_NEW_PASSWORD_GUIDELINES);
  await expect(passwordResetSubmitButton(page)).toBeVisible();
  await expect(page.getByText(/SALTISE lobby/)).toHaveCount(0);
}

/** FR-PWD-002 — empty fields, disabled submit, no validation messages before interaction. */
export async function expectPasswordResetFormInitialStatePerFrPwd002(page: Page): Promise<void> {
  await expect(currentPasswordField(page)).toHaveValue('');
  await expect(newPasswordField(page)).toHaveValue('');
  await expect(confirmNewPasswordField(page)).toHaveValue('');
  await expect(passwordResetSubmitButton(page)).toBeDisabled();
  for (const message of Object.values(PASSWORD_RESET_VALIDATION_MESSAGES)) {
    await expect(passwordResetFieldValidationMessage(page, message)).toHaveCount(0);
  }
}

export async function fillPasswordResetForm(
  page: Page,
  values: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  },
): Promise<void> {
  await currentPasswordField(page).fill(values.currentPassword);
  await newPasswordField(page).fill(values.newPassword);
  await confirmNewPasswordField(page).fill(values.confirmNewPassword);
}

export async function clearFieldAfterInteraction(
  page: Page,
  field: 'current' | 'new' | 'confirm',
): Promise<void> {
  const locator =
    field === 'current'
      ? currentPasswordField(page)
      : field === 'new'
        ? newPasswordField(page)
        : confirmNewPasswordField(page);

  await locator.fill('placeholder');
  await locator.fill('');
  await locator.blur();
}
