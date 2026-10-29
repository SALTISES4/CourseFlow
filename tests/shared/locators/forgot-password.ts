import type { Locator, Page } from "@playwright/test";

export const FORGOT_PASSWORD_TITLE = "Reset your CourseFlow password";
export const PASSWORD_GUIDELINES =
  "Your password must contain at least 12 characters and include a mix of numbers, letters and symbols";

export const FORGOT_PASSWORD_MESSAGES = {
  requestSucceeded:
    "If the email address matches an active account, you will receive instructions to reset your password shortly.",
  requestFailed:
    "We encountered an issue and your password reset request could not be sent",
  resetSucceeded: "Your password has been successfully reset",
  resetFailed: "We encountered an issue and your password was not reset",
} as const;

export const FORGOT_PASSWORD_VALIDATION_MESSAGES = {
  emailRequired: "Email is required",
  invalidEmail: "Invalid email format",
  passwordRequired: "New password is required",
  confirmationRequired: "Confirm new password is required",
  mismatch: "Passwords do not match",
} as const;

export function forgotPasswordForm(page: Page): Locator {
  return page.getByTestId("forgot-password-form");
}

export function forgotPasswordEmailField(page: Page): Locator {
  return forgotPasswordForm(page).locator('input[name="email"]');
}

export function forgotPasswordSubmitButton(page: Page): Locator {
  return forgotPasswordForm(page).getByRole("button", {
    name: "Reset password",
    exact: true,
  });
}

export function forgotPasswordConfirmForm(page: Page): Locator {
  return page.getByTestId("forgot-password-confirm-form");
}

export function forgotPasswordNewPasswordField(page: Page): Locator {
  return forgotPasswordConfirmForm(page).locator(
    'input[name="password"][type="password"]',
  );
}

export function forgotPasswordConfirmPasswordField(page: Page): Locator {
  return forgotPasswordConfirmForm(page).locator(
    'input[name="confirmPassword"][type="password"]',
  );
}

export function forgotPasswordConfirmSubmitButton(page: Page): Locator {
  return forgotPasswordConfirmForm(page).getByRole("button", {
    name: "Reset password",
    exact: true,
  });
}

export function forgotPasswordInvalidLinkPage(page: Page): Locator {
  return page.getByTestId("forgot-password-invalid-link-page");
}
