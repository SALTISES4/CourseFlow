import { test, expect } from '../../fixtures';
import { requireTestCredentials } from '../../helpers/env';
import {
  clearLoginFieldAfterInteraction,
  expectAuthenticated,
  expectLoginAuthenticationErrorPerFrLogin004,
  expectLoginPagePrimaryLayoutPerFrLogin001,
  expectNotAuthenticated,
  expectSuccessfulLoginPerFrLogin005,
  gotoLoginPage,
  submitLoginForm,
} from '../../helpers/login-page';
import {
  LOGIN_FIELD_VALIDATION_MESSAGES,
  loginAuthenticationErrorMessage,
  loginEmailField,
  loginFieldValidationMessage,
  loginForgotPasswordLink,
  loginForm,
  loginPasswordField,
  loginRegisterLink,
  loginSubmitButton,
} from './login.locators';

/**
 * Calibration slice — FR-LOGIN-001 through FR-LOGIN-005.
 * Requirements: tests/docs/requirements/features/auth/login_requirements_v1.yaml
 */

test.describe('Login — calibration (FR-LOGIN-001-005)', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test.describe('FR-LOGIN-001: route and primary form elements', () => {
      test.beforeEach(async ({ page }) => {
        await gotoLoginPage(page);
      });

      test('renders login route with primary layout and initial form state', async ({ page }) => {
        await expectLoginPagePrimaryLayoutPerFrLogin001(page);
      });
    });

    test.describe('FR-LOGIN-002: external link navigation', () => {
      test.beforeEach(async ({ page }) => {
        await gotoLoginPage(page);
      });

      test('Forgot your password? navigates to /password-reset', async ({ page }) => {
        await loginForgotPasswordLink(page).click();
        await expect(page).toHaveURL(/\/password-reset\/?(?:[?#].*)?$/);
      });

      test('Register navigates to /register/', async ({ page }) => {
        await loginRegisterLink(page).click();
        await expect(page).toHaveURL(/\/register\/?(?:[?#].*)?$/);
      });
    });

    test.describe('FR-LOGIN-003: field validation rules', () => {
      test.beforeEach(async ({ page }) => {
        await gotoLoginPage(page);
      });

      test('email required after field is cleared following interaction', async ({ page }) => {
        await loginEmailField(page).fill('teacher@example.com');
        await clearLoginFieldAfterInteraction(page, 'email');
        await expect(
          loginFieldValidationMessage(page, LOGIN_FIELD_VALIDATION_MESSAGES.emailRequired),
        ).toBeVisible();
        await expect(loginSubmitButton(page)).toBeDisabled();
      });

      test('invalid email format after interaction', async ({ page }) => {
        await loginEmailField(page).fill('not-an-email');
        await loginEmailField(page).blur();
        await expect(
          loginFieldValidationMessage(page, LOGIN_FIELD_VALIDATION_MESSAGES.invalidEmailFormat),
        ).toBeVisible();
        await expect(loginSubmitButton(page)).toBeDisabled();
      });

      test('password required after field is cleared following interaction', async ({ page }) => {
        await loginPasswordField(page).fill('secret');
        await clearLoginFieldAfterInteraction(page, 'password');
        await expect(
          loginFieldValidationMessage(page, LOGIN_FIELD_VALIDATION_MESSAGES.passwordRequired),
        ).toBeVisible();
        await expect(loginSubmitButton(page)).toBeDisabled();
      });

      test('password field masks entered characters', async ({ page }) => {
        await loginPasswordField(page).fill('secret');
        await expect(loginPasswordField(page)).toHaveAttribute('type', 'password');
      });

      test('submit stays disabled while any field is invalid', async ({ page }) => {
        await loginEmailField(page).fill('not-an-email');
        await loginPasswordField(page).fill('secret');
        await expect(loginSubmitButton(page)).toBeDisabled();
      });

      test('email validation clears after entering a valid email address', async ({ page }) => {
        await loginEmailField(page).fill('not-an-email');
        await loginEmailField(page).blur();
        await expect(
          loginFieldValidationMessage(page, LOGIN_FIELD_VALIDATION_MESSAGES.invalidEmailFormat),
        ).toBeVisible();

        await loginEmailField(page).fill('teacher@example.com');
        await expect(
          loginFieldValidationMessage(page, LOGIN_FIELD_VALIDATION_MESSAGES.invalidEmailFormat),
        ).toHaveCount(0);
      });

      test('password validation clears after entering a non-empty value', async ({ page }) => {
        await loginPasswordField(page).fill('secret');
        await clearLoginFieldAfterInteraction(page, 'password');
        await expect(
          loginFieldValidationMessage(page, LOGIN_FIELD_VALIDATION_MESSAGES.passwordRequired),
        ).toBeVisible();

        await loginPasswordField(page).fill('secret');
        await expect(
          loginFieldValidationMessage(page, LOGIN_FIELD_VALIDATION_MESSAGES.passwordRequired),
        ).toHaveCount(0);
      });

      test('submit enables when all fields are valid', async ({ page }) => {
        await loginEmailField(page).fill('teacher@example.com');
        await loginPasswordField(page).fill('ValidP@ssw0rd!123');
        await expect(loginSubmitButton(page)).toBeEnabled();
      });
    });

    test.describe('FR-LOGIN-004: failed login with invalid credentials', () => {
      test.beforeEach(async ({ page }) => {
        await gotoLoginPage(page);
      });

      test('invalid credentials show authentication error and retain field values', async ({
        page,
      }) => {
        const { username } = requireTestCredentials();
        const submittedPassword = 'WrongP@ssw0rd!123';

        await submitLoginForm(page, {
          email: username,
          password: submittedPassword,
        });

        await expectLoginAuthenticationErrorPerFrLogin004(page);
        await expect(loginEmailField(page)).toHaveValue(username);
        await expect(loginPasswordField(page)).toHaveValue(submittedPassword);
      });

      test('authentication error hides when user edits email', async ({ page }) => {
        const { username } = requireTestCredentials();

        await submitLoginForm(page, {
          email: username,
          password: 'WrongP@ssw0rd!123',
        });
        await expect(loginAuthenticationErrorMessage(page)).toBeVisible();

        await loginEmailField(page).fill(`${username}x`);
        await expect(loginAuthenticationErrorMessage(page)).toHaveCount(0);
        await expectNotAuthenticated(page);
        await expect(page).toHaveURL(/\/login\/?(?:[?#].*)?$/);
      });

      test('authentication error hides when user edits password', async ({ page }) => {
        const { username } = requireTestCredentials();

        await submitLoginForm(page, {
          email: username,
          password: 'WrongP@ssw0rd!123',
        });
        await expect(loginAuthenticationErrorMessage(page)).toBeVisible();

        await loginPasswordField(page).fill('DifferentP@ssw0rd!123');
        await expect(loginAuthenticationErrorMessage(page)).toHaveCount(0);
        await expectNotAuthenticated(page);
      });
    });

    test.describe('FR-LOGIN-005: successful login and redirect to Home', () => {
      test('valid credentials authenticate and navigate to /home without snackbar', async ({
        page,
      }) => {
        const { username, password } = requireTestCredentials();
        await gotoLoginPage(page);

        await submitLoginForm(page, { email: username, password });
        await expectSuccessfulLoginPerFrLogin005(page);
      });
    });
  });

  test.describe('FR-LOGIN-001: authenticated user redirect', () => {
    test('authenticated user navigating to /login/ is redirected to /home', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveURL(/\/home\/?(?:[?#].*)?$/);
      await expect(loginForm(page)).toHaveCount(0);
      await expectAuthenticated(page);
    });
  });
});
