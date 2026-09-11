import { expect, type Page } from '@playwright/test';

import { homeWelcomeHeading } from '../e2e/home/home.locators';
import {
  LOGIN_AUTHENTICATION_ERROR_MESSAGE,
  LOGIN_FIELD_VALIDATION_MESSAGES,
  LOGIN_REGISTER_PROMPT,
  LOGIN_TITLE,
  expectFollowsInDocumentOrder,
  loginAuthenticationErrorMessage,
  loginBrandLockup,
  loginEmailField,
  loginFieldValidationMessage,
  loginForgotPasswordLink,
  loginForm,
  loginPasswordField,
  loginRegisterLink,
  loginRegisterPrompt,
  loginSubmitButton,
  loginTitle,
  waitForLoginPageLoaded,
} from '../shared/locators/login';
import { globalMessageSnackbar } from '../shared/locators/global';

const ACCESS_TOKEN_STORAGE_KEY = 'cf2_access_token';

export async function gotoLoginPage(page: Page): Promise<void> {
  await page.goto('/login');
  await waitForLoginPageLoaded(page);
}

export async function expectNotAuthenticated(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate((key) => window.localStorage.getItem(key), ACCESS_TOKEN_STORAGE_KEY))
    .toBeNull();
}

export async function expectAuthenticated(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate((key) => window.localStorage.getItem(key), ACCESS_TOKEN_STORAGE_KEY))
    .not.toBeNull();
}

export async function clearLoginFieldAfterInteraction(
  page: Page,
  field: 'email' | 'password',
): Promise<void> {
  const locator = field === 'email' ? loginEmailField(page) : loginPasswordField(page);
  await locator.fill('placeholder');
  await locator.fill('');
  await locator.blur();
}

export async function submitLoginForm(
  page: Page,
  credentials: { email: string; password: string },
): Promise<void> {
  await loginEmailField(page).fill(credentials.email);
  await loginPasswordField(page).fill(credentials.password);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/auth/login') && response.request().method() === 'POST',
  );

  await loginSubmitButton(page).click();
  await loginResponsePromise;
}

/** FR-LOGIN-001 — primary layout and initial form state. */
export async function expectLoginPagePrimaryLayoutPerFrLogin001(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login\/?(?:[?#].*)?$/);
  await expect(loginForm(page)).toBeVisible();
  await expect(loginBrandLockup(page)).toBeVisible();
  await expect(loginTitle(page)).toBeVisible();
  await expect(loginEmailField(page)).toBeVisible();
  await expect(loginEmailField(page)).toHaveValue('');
  await expect(loginPasswordField(page)).toBeVisible();
  await expect(loginPasswordField(page)).toHaveValue('');
  await expect(loginPasswordField(page)).toHaveAttribute('type', 'password');
  await expect(loginForgotPasswordLink(page)).toBeVisible();
  await expect(loginSubmitButton(page)).toBeVisible();
  await expect(loginRegisterPrompt(page)).toHaveText(LOGIN_REGISTER_PROMPT, { exact: true });
  await expect(loginRegisterLink(page)).toBeVisible();
  await expect(loginSubmitButton(page)).toBeDisabled();

  await expectFollowsInDocumentOrder(loginBrandLockup(page), loginTitle(page));
  await expectFollowsInDocumentOrder(loginTitle(page), loginEmailField(page));
  await expectFollowsInDocumentOrder(loginEmailField(page), loginPasswordField(page));
  await expectFollowsInDocumentOrder(loginPasswordField(page), loginForgotPasswordLink(page));
  await expectFollowsInDocumentOrder(loginForgotPasswordLink(page), loginSubmitButton(page));
  await expectFollowsInDocumentOrder(loginSubmitButton(page), loginRegisterPrompt(page));
  await expectFollowsInDocumentOrder(loginRegisterPrompt(page), loginRegisterLink(page));

  for (const message of Object.values(LOGIN_FIELD_VALIDATION_MESSAGES)) {
    await expect(loginFieldValidationMessage(page, message)).toHaveCount(0);
  }
}

/** FR-LOGIN-004 — failed login form order when authentication error is visible. */
export async function expectLoginFailedFormOrderPerFrLogin004(page: Page): Promise<void> {
  await expectFollowsInDocumentOrder(loginTitle(page), loginAuthenticationErrorMessage(page));
  await expectFollowsInDocumentOrder(loginAuthenticationErrorMessage(page), loginEmailField(page));
  await expectFollowsInDocumentOrder(loginEmailField(page), loginPasswordField(page));
  await expectFollowsInDocumentOrder(loginPasswordField(page), loginForgotPasswordLink(page));
  await expectFollowsInDocumentOrder(loginForgotPasswordLink(page), loginSubmitButton(page));
  await expectFollowsInDocumentOrder(loginSubmitButton(page), loginRegisterPrompt(page));
  await expectFollowsInDocumentOrder(loginRegisterPrompt(page), loginRegisterLink(page));
}

/** FR-LOGIN-004 — failed login with invalid credentials. */
export async function expectLoginAuthenticationErrorPerFrLogin004(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login\/?(?:[?#].*)?$/);
  await expectNotAuthenticated(page);
  await expect(loginForm(page)).toBeVisible();
  await expect(loginTitle(page)).toBeVisible();
  await expect(loginAuthenticationErrorMessage(page)).toBeVisible();
  await expect(loginAuthenticationErrorMessage(page)).toHaveText(
    LOGIN_AUTHENTICATION_ERROR_MESSAGE,
    { exact: true },
  );
  await expect(loginForgotPasswordLink(page)).toBeVisible();
  await expect(loginRegisterPrompt(page)).toBeVisible();
  await expect(loginRegisterLink(page)).toBeVisible();
  await expect(loginSubmitButton(page)).toBeEnabled();
  await expectLoginFailedFormOrderPerFrLogin004(page);
}

/** FR-LOGIN-005 — successful login lands on Home without snackbar. */
export async function expectSuccessfulLoginPerFrLogin005(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/home\/?(?:[?#].*)?$/);
  await expectAuthenticated(page);
  await expect(globalMessageSnackbar(page)).toHaveCount(0);
  await expect(homeWelcomeHeading(page)).toBeVisible();
}
