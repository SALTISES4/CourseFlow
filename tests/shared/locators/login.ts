import { expect, type Locator, type Page } from '@playwright/test';

import { BRAND_NAME } from './navigation';

/** FR-LOGIN-004 — exact copy per login_requirements_v1.yaml */
export const LOGIN_AUTHENTICATION_ERROR_MESSAGE =
  'The email or password you entered is incorrect. please check your details and try again.';

export const LOGIN_FIELD_VALIDATION_MESSAGES = {
  emailRequired: 'Email is required',
  invalidEmailFormat: 'Invalid email format',
  passwordRequired: 'Password is required',
} as const;

/** FR-LOGIN-001 — page title copy */
export const LOGIN_TITLE = 'Login to CourseFlow';

/** FR-LOGIN-001 — static prompt adjacent to register link (trailing space per spec) */
export const LOGIN_REGISTER_PROMPT = "Don't have an account? ";

/** canonical: loginPage — URL pathname '/login/' */
export function loginPage(page: Page): Locator {
  return page.locator('body');
}

/** canonical: loginForm — form on loginPage */
export function loginForm(page: Page): Locator {
  return page.locator('form').filter({ has: loginEmailField(page) });
}

/** brandLockup on loginForm (CourseFlow logo + name) */
export function loginBrandLockup(page: Page): Locator {
  return loginForm(page).getByText(BRAND_NAME, { exact: true });
}

/** canonical: loginTitle */
export function loginTitle(page: Page): Locator {
  return loginForm(page).getByText(LOGIN_TITLE, { exact: true });
}

/** canonical: loginEmailField */
export function loginEmailField(page: Page): Locator {
  return loginForm(page).locator('input[name="email"]');
}

/** canonical: loginPasswordField */
export function loginPasswordField(page: Page): Locator {
  return loginForm(page).locator('input[name="password"][type="password"]');
}

/** canonical: loginSubmitButton */
export function loginSubmitButton(page: Page): Locator {
  return loginForm(page).getByRole('button', { name: 'Login', exact: true });
}

/** canonical: loginForgotPasswordLink */
export function loginForgotPasswordLink(page: Page): Locator {
  return loginForm(page).getByRole('link', { name: 'Forgot your password?', exact: true });
}

/** canonical: loginRegisterPrompt */
export function loginRegisterPrompt(page: Page): Locator {
  return loginForm(page).getByText(LOGIN_REGISTER_PROMPT, { exact: true });
}

/** canonical: loginRegisterLink */
export function loginRegisterLink(page: Page): Locator {
  return loginForm(page).getByRole('link', { name: 'Register', exact: true });
}

/** canonical: loginAuthenticationErrorMessage */
export function loginAuthenticationErrorMessage(page: Page): Locator {
  return loginForm(page).getByRole('alert');
}

/** canonical: loginFieldValidationMessage — inline validation on loginForm */
export function loginFieldValidationMessage(page: Page, message: string): Locator {
  return loginForm(page).getByText(message, { exact: true });
}

export async function expectFollowsInDocumentOrder(earlier: Locator, later: Locator): Promise<void> {
  await expect
    .poll(async () => {
      const earlierHandle = await earlier.elementHandle();
      const laterHandle = await later.elementHandle();
      if (!earlierHandle || !laterHandle) {
        return false;
      }
      return earlierHandle.evaluate(
        (earlierEl, laterEl) =>
          Boolean(earlierEl.compareDocumentPosition(laterEl) & Node.DOCUMENT_POSITION_FOLLOWING),
        laterHandle,
      );
    })
    .toBe(true);
}

export async function waitForLoginPageLoaded(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login\/?(?:[?#].*)?$/);
  await expect(loginForm(page)).toBeVisible();
  await expect(loginEmailField(page)).toBeVisible();
  await expect(loginPasswordField(page)).toBeVisible();
  await expect(loginSubmitButton(page)).toBeVisible();
}
