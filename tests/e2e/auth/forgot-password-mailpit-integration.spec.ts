import { expect, test } from "../../fixtures";
import {
  expectAuthenticated,
  expectLoginAuthenticationErrorPerFrLogin004,
  submitLoginForm,
} from "../../helpers/login-page";
import {
  extractPasswordResetUrl,
  waitForCapturedEmail,
} from "../../helpers/mailpit";
import { globalMessageSnackbar } from "../../shared/locators/global";
import {
  FORGOT_PASSWORD_MESSAGES,
  forgotPasswordConfirmForm,
  forgotPasswordConfirmPasswordField,
  forgotPasswordConfirmSubmitButton,
  forgotPasswordEmailField,
  forgotPasswordInvalidLinkPage,
  forgotPasswordNewPasswordField,
  forgotPasswordSubmitButton,
} from "../../shared/locators/forgot-password";

const RESET_REQUEST_SUBJECT = "CourseFlow password reset request";
const PASSWORD_CHANGED_SUBJECT = "Your CourseFlow password was reset";

test.describe("Forgot password — Mailpit transport integration", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("FR-FPWD-004/005/008/009/011 completes the real email-link journey", async ({
    page,
    request,
    disposableUser,
  }) => {
    const newPassword = `E2E-Recovered-${Date.now()}!`;

    await page.goto("/password-reset");
    await forgotPasswordEmailField(page).fill(disposableUser.email);
    const requestResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/password-reset/request") &&
        response.request().method() === "POST",
    );
    await forgotPasswordSubmitButton(page).click();
    const requestResponse = await requestResponsePromise;

    expect(requestResponse.status()).toBe(200);
    await expect(
      page.getByText(FORGOT_PASSWORD_MESSAGES.requestSucceeded, {
        exact: true,
      }),
    ).toBeVisible();

    const resetMessage = await waitForCapturedEmail(request, {
      recipient: disposableUser.email,
      subject: RESET_REQUEST_SUBJECT,
    });
    const resetUrl = extractPasswordResetUrl(resetMessage);

    await page.goto(resetUrl);
    await expect(forgotPasswordConfirmForm(page)).toBeVisible();
    await forgotPasswordNewPasswordField(page).fill(newPassword);
    await forgotPasswordConfirmPasswordField(page).fill(newPassword);
    await forgotPasswordConfirmSubmitButton(page).click();

    await expect(page).toHaveURL(/\/login\/?$/);
    await expect(globalMessageSnackbar(page)).toHaveText(
      FORGOT_PASSWORD_MESSAGES.resetSucceeded,
      { exact: true },
    );
    await waitForCapturedEmail(request, {
      recipient: disposableUser.email,
      subject: PASSWORD_CHANGED_SUBJECT,
    });

    await page.goto(resetUrl);
    await expect(forgotPasswordInvalidLinkPage(page)).toBeVisible();

    await page.goto("/login/");
    await submitLoginForm(page, {
      email: disposableUser.email,
      password: disposableUser.password,
    });
    await expectLoginAuthenticationErrorPerFrLogin004(page);

    await submitLoginForm(page, {
      email: disposableUser.email,
      password: newPassword,
    });
    await expect(page).toHaveURL(/\/home\/?$/);
    await expectAuthenticated(page);
    await expect(globalMessageSnackbar(page)).toHaveCount(0);
  });
});
