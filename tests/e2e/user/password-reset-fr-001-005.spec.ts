import { test, expect } from '@playwright/test';
import { requireTestCredentials } from '../../helpers/env';
import {
  clearFieldAfterInteraction,
  expectPasswordResetFormInitialStatePerFrPwd002,
  expectPasswordResetPagePrimaryLayoutPerFrPwd001,
  fillPasswordResetForm,
  gotoPasswordResetPage,
  sampleValidNewPassword,
} from '../../helpers/password-reset-page';
import { topNavigationBar } from '../navigation/navigation.locators';
import {
  PASSWORD_NEW_PASSWORD_GUIDELINES,
  PASSWORD_RESET_API_ROUTE,
  PASSWORD_RESET_SNACKBAR_MESSAGES,
  PASSWORD_RESET_VALIDATION_MESSAGES,
  confirmNewPasswordField,
  currentPasswordField,
  globalMessageSnackbar,
  newPasswordField,
  passwordResetFieldValidationMessage,
  passwordResetSubmitButton,
  waitForPasswordResetPageLoaded,
} from './user.locators';

/**
 * Calibration slice — FR-PWD-001 through FR-PWD-005.
 * Requirements: tests/docs/requirements/features/auth/password_reset_requirements_v1.yaml
 * Auth: chromium project storage state (teacher@courseflow.com).
 */

test.describe('Password reset — calibration (FR-PWD-001–005)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await gotoPasswordResetPage(page);
  });

  test('FR-PWD-001: route renders primary layout', async ({ page }) => {
    await expectPasswordResetPagePrimaryLayoutPerFrPwd001(page);
  });

  test('FR-PWD-002: form starts empty with submit disabled and no validation messages', async ({
    page,
  }) => {
    await expectPasswordResetFormInitialStatePerFrPwd002(page);
  });

  test.describe('FR-PWD-003: field validation', () => {
    test('required messages after fields are cleared following interaction', async ({
      page,
    }) => {
      await currentPasswordField(page).fill('temp');
      await clearFieldAfterInteraction(page, 'current');
      await expect(
        passwordResetFieldValidationMessage(
          page,
          PASSWORD_RESET_VALIDATION_MESSAGES.currentRequired,
        ),
      ).toBeVisible();

      await newPasswordField(page).fill('temp');
      await clearFieldAfterInteraction(page, 'new');
      await expect(
        passwordResetFieldValidationMessage(
          page,
          PASSWORD_RESET_VALIDATION_MESSAGES.newRequired,
        ),
      ).toBeVisible();

      await confirmNewPasswordField(page).fill('temp');
      await clearFieldAfterInteraction(page, 'confirm');
      await expect(
        passwordResetFieldValidationMessage(
          page,
          PASSWORD_RESET_VALIDATION_MESSAGES.confirmRequired,
        ),
      ).toBeVisible();
    });

    test('new password guidelines message when value is too weak', async ({
      page,
    }) => {
      await newPasswordField(page).fill('short');
      await newPasswordField(page).blur();
      await expect(
        passwordResetFieldValidationMessage(
          page,
          PASSWORD_NEW_PASSWORD_GUIDELINES,
        ),
      ).toBeVisible();
      await expect(newPasswordField(page)).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      await expect(passwordResetSubmitButton(page)).toBeDisabled();
    });

    test('new password must differ from current password', async ({ page }) => {
      const current = 'SameP@ssword123!';
      await currentPasswordField(page).fill(current);
      await newPasswordField(page).fill(current);
      await newPasswordField(page).blur();
      await expect(
        passwordResetFieldValidationMessage(
          page,
          PASSWORD_RESET_VALIDATION_MESSAGES.newMustDiffer,
        ),
      ).toBeVisible();
      await expect(passwordResetSubmitButton(page)).toBeDisabled();
    });

    test('confirm password mismatch and recovery', async ({ page }) => {
      const newPassword = sampleValidNewPassword();
      await newPasswordField(page).fill(newPassword);
      await confirmNewPasswordField(page).fill(`${newPassword}x`);
      await confirmNewPasswordField(page).blur();
      await expect(
        passwordResetFieldValidationMessage(
          page,
          PASSWORD_RESET_VALIDATION_MESSAGES.passwordsDoNotMatch,
        ),
      ).toBeVisible();
      await expect(passwordResetSubmitButton(page)).toBeDisabled();

      await confirmNewPasswordField(page).fill(newPassword);
      await expect(
        passwordResetFieldValidationMessage(
          page,
          PASSWORD_RESET_VALIDATION_MESSAGES.passwordsDoNotMatch,
        ),
      ).toHaveCount(0);
    });

    test('mismatch reappears when new password changes after confirm matched', async ({
      page,
    }) => {
      const newPassword = sampleValidNewPassword();
      await newPasswordField(page).fill(newPassword);
      await confirmNewPasswordField(page).fill(newPassword);
      await newPasswordField(page).fill(`${newPassword}x`);
      await newPasswordField(page).blur();
      await expect(
        passwordResetFieldValidationMessage(
          page,
          PASSWORD_RESET_VALIDATION_MESSAGES.passwordsDoNotMatch,
        ),
      ).toBeVisible();
    });

    test('submit enables when all fields are valid', async ({ page }) => {
      const { password: currentPassword } = requireTestCredentials();
      const newPassword = sampleValidNewPassword();
      await fillPasswordResetForm(page, {
        currentPassword,
        newPassword,
        confirmNewPassword: newPassword,
      });
      await expect(passwordResetSubmitButton(page)).toBeEnabled();
    });
  });

  test.describe('FR-PWD-004: submit failure', () => {
    test('incorrect current password shows field-level error and retains values', async ({
      page,
    }) => {
      const newPassword = sampleValidNewPassword();
      await fillPasswordResetForm(page, {
        currentPassword: 'definitely-wrong-current-password',
        newPassword,
        confirmNewPassword: newPassword,
      });
      await passwordResetSubmitButton(page).click();

      await expect(
        passwordResetFieldValidationMessage(
          page,
          PASSWORD_RESET_VALIDATION_MESSAGES.currentIncorrect,
        ),
      ).toBeVisible({ timeout: 15_000 });
      await expect(currentPasswordField(page)).toHaveValue(
        'definitely-wrong-current-password',
      );
      await expect(newPasswordField(page)).toHaveValue(newPassword);
      await expect(confirmNewPasswordField(page)).toHaveValue(newPassword);

      await currentPasswordField(page).fill('updated-current');
      await expect(
        passwordResetFieldValidationMessage(
          page,
          PASSWORD_RESET_VALIDATION_MESSAGES.currentIncorrect,
        ),
      ).toHaveCount(0);
    });

    test('non-field server failure shows snackbar and retains field values', async ({
      page,
    }) => {
      const { password: currentPassword } = requireTestCredentials();
      const newPassword = sampleValidNewPassword();

      await page.route(PASSWORD_RESET_API_ROUTE, (route) => {
        if (route.request().method() !== 'PATCH') {
          void route.continue();
          return;
        }

        void route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'E2E simulated password reset failure',
          }),
        });
      });

      await fillPasswordResetForm(page, {
        currentPassword,
        newPassword,
        confirmNewPassword: newPassword,
      });
      await passwordResetSubmitButton(page).click();

      await expect(globalMessageSnackbar(page)).toBeVisible({
        timeout: 15_000,
      });
      await expect(globalMessageSnackbar(page)).toHaveText(
        PASSWORD_RESET_SNACKBAR_MESSAGES.failure,
        { exact: true },
      );
      await expect(currentPasswordField(page)).toHaveValue(currentPassword);
      await expect(newPasswordField(page)).toHaveValue(newPassword);
      await expect(confirmNewPasswordField(page)).toHaveValue(newPassword);
    });
  });

  test('FR-PWD-005: successful submit clears form, shows snackbar, and keeps user on page', async ({
    page,
  }) => {
    const { password: currentPassword } = requireTestCredentials();
    const newPassword = sampleValidNewPassword();

    await page.route(PASSWORD_RESET_API_ROUTE, (route) => {
      if (route.request().method() !== 'PATCH') {
        void route.continue();
        return;
      }

      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ uuid: '00000000-0000-4000-8000-000000000001' }),
      });
    });

    await fillPasswordResetForm(page, {
      currentPassword,
      newPassword,
      confirmNewPassword: newPassword,
    });
    await passwordResetSubmitButton(page).click();

    await expect(globalMessageSnackbar(page)).toBeVisible({ timeout: 15_000 });
    await expect(globalMessageSnackbar(page)).toHaveText(
      PASSWORD_RESET_SNACKBAR_MESSAGES.success,
      { exact: true },
    );
    await expect(currentPasswordField(page)).toHaveValue('');
    await expect(newPasswordField(page)).toHaveValue('');
    await expect(confirmNewPasswordField(page)).toHaveValue('');
    await expect(passwordResetSubmitButton(page)).toBeDisabled();
    await expect(page).toHaveURL(/\/user\/password-reset\/?$/);
    await expect(topNavigationBar(page)).toBeVisible();
    await waitForPasswordResetPageLoaded(page);
  });
});
