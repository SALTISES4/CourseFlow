import { expect, test } from "../../fixtures";
import { expectNotAuthenticated } from "../../helpers/login-page";
import { globalMessageSnackbar } from "../../shared/locators/global";
import {
  FORGOT_PASSWORD_MESSAGES,
  FORGOT_PASSWORD_TITLE,
  FORGOT_PASSWORD_VALIDATION_MESSAGES,
  PASSWORD_GUIDELINES,
  forgotPasswordConfirmForm,
  forgotPasswordConfirmPasswordField,
  forgotPasswordConfirmSubmitButton,
  forgotPasswordEmailField,
  forgotPasswordForm,
  forgotPasswordInvalidLinkPage,
  forgotPasswordNewPasswordField,
  forgotPasswordSubmitButton,
} from "../../shared/locators/forgot-password";
import { loginForm } from "../../shared/locators/login";

const REQUEST_API = "**/api/auth/password-reset/request";
const VALIDATE_API = "**/api/auth/password-reset/validate";
const CONFIRM_API = "**/api/auth/password-reset/confirm";
const VALID_LINK = "/password-reset/confirm#uid=MQ&token=valid-token";

async function mockValidLink(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page.route(VALIDATE_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ valid: true }),
    }),
  );
}

test.describe("Forgot password — FR-FPWD-001–014", () => {
  test.describe("unauthenticated", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("request page has the required initial layout and validation", async ({
      page,
    }) => {
      await page.goto("/password-reset");

      await expect(page).toHaveURL(/\/password-reset\/?$/);
      await expect(forgotPasswordForm(page)).toBeVisible();
      await expect(
        forgotPasswordForm(page).getByText("CourseFlow", { exact: true }),
      ).toBeVisible();
      await expect(
        forgotPasswordForm(page).getByRole("heading", {
          name: FORGOT_PASSWORD_TITLE,
          exact: true,
        }),
      ).toBeVisible();
      await expect(forgotPasswordEmailField(page)).toHaveValue("");
      await expect(forgotPasswordSubmitButton(page)).toBeDisabled();
      await expect(page.getByRole("link", { name: /login/i })).toHaveCount(0);
      for (const message of [
        FORGOT_PASSWORD_VALIDATION_MESSAGES.emailRequired,
        FORGOT_PASSWORD_VALIDATION_MESSAGES.invalidEmail,
      ]) {
        await expect(
          forgotPasswordForm(page).getByText(message, { exact: true }),
        ).toHaveCount(0);
      }

      await forgotPasswordEmailField(page).fill("not-an-email");
      await expect(
        forgotPasswordForm(page).getByText(
          FORGOT_PASSWORD_VALIDATION_MESSAGES.invalidEmail,
          { exact: true },
        ),
      ).toBeVisible();
      await expect(forgotPasswordSubmitButton(page)).toBeDisabled();

      await forgotPasswordEmailField(page).fill("teacher@example.com");
      await expect(forgotPasswordSubmitButton(page)).toBeEnabled();
      await forgotPasswordEmailField(page).fill("");
      await expect(
        forgotPasswordForm(page).getByText(
          FORGOT_PASSWORD_VALIDATION_MESSAGES.emailRequired,
          { exact: true },
        ),
      ).toBeVisible();
    });

    test("successful request shows the indistinguishable generic success state", async ({
      page,
    }) => {
      let submittedBody: unknown;
      await page.route(REQUEST_API, async (route) => {
        submittedBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      });
      await page.goto("/password-reset");
      await forgotPasswordEmailField(page).fill("  teacher@example.com  ");
      await forgotPasswordSubmitButton(page).click();

      await expect(page).toHaveURL(/\/password-reset\/?$/);
      await expect(forgotPasswordForm(page)).toHaveCount(0);
      await expect(
        page.getByText(FORGOT_PASSWORD_MESSAGES.requestSucceeded, {
          exact: true,
        }),
      ).toBeVisible();
      expect(submittedBody).toEqual({ email: "teacher@example.com" });
      await expectNotAuthenticated(page);
    });

    test("request failure retains the email and exposes only the generic snackbar", async ({
      page,
    }) => {
      await page.route(REQUEST_API, (route) =>
        route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            code: "password_reset_email_delivery_failed",
            params: {},
          }),
        }),
      );
      await page.goto("/password-reset");
      await forgotPasswordEmailField(page).fill("teacher@example.com");
      await forgotPasswordSubmitButton(page).click();

      await expect(globalMessageSnackbar(page)).toHaveText(
        FORGOT_PASSWORD_MESSAGES.requestFailed,
        { exact: true },
      );
      await expect(forgotPasswordEmailField(page)).toHaveValue(
        "teacher@example.com",
      );
      await expect(forgotPasswordSubmitButton(page)).toBeEnabled();
    });

    test("valid link shows the new-password form and enforces all field rules", async ({
      page,
    }) => {
      await mockValidLink(page);
      await page.goto(VALID_LINK);

      await expect(forgotPasswordConfirmForm(page)).toBeVisible();
      await expect(forgotPasswordNewPasswordField(page)).toHaveValue("");
      await expect(forgotPasswordConfirmPasswordField(page)).toHaveValue("");
      await expect(forgotPasswordConfirmSubmitButton(page)).toBeDisabled();
      await expect(
        forgotPasswordConfirmForm(page).getByText(PASSWORD_GUIDELINES, {
          exact: true,
        }),
      ).toBeVisible();

      await forgotPasswordNewPasswordField(page).fill("weak");
      await expect(
        forgotPasswordConfirmForm(page).getByText(PASSWORD_GUIDELINES, {
          exact: true,
        }),
      ).toHaveCount(2);
      await forgotPasswordNewPasswordField(page).fill(
        "Valid-New-Password-123!",
      );
      await forgotPasswordConfirmPasswordField(page).fill("different");
      await expect(
        forgotPasswordConfirmForm(page).getByText(
          FORGOT_PASSWORD_VALIDATION_MESSAGES.mismatch,
          { exact: true },
        ),
      ).toBeVisible();
      await forgotPasswordConfirmPasswordField(page).fill(
        "Valid-New-Password-123!",
      );
      await expect(forgotPasswordConfirmSubmitButton(page)).toBeEnabled();
    });

    test("invalid, expired, or used link shows only the invalid-link state", async ({
      page,
    }) => {
      await page.route(VALIDATE_API, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ valid: false }),
        }),
      );
      await page.goto("/password-reset/confirm#uid=MQ&token=expired");

      await expect(forgotPasswordInvalidLinkPage(page)).toBeVisible();
      await expect(forgotPasswordConfirmForm(page)).toHaveCount(0);
      await expect(
        page.getByText("Link expired or invalid", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(
          "For your security, password reset links expire after 24 hours and can only be used once.",
          { exact: true },
        ),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Request a new link", exact: true })
        .click();
      await expect(page).toHaveURL(/\/password-reset\/?$/);
      await expect(forgotPasswordEmailField(page)).toHaveValue("");
    });

    test("successful reset navigates to login, shows success, and issues no token", async ({
      page,
    }) => {
      await mockValidLink(page);
      await page.route(CONFIRM_API, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        }),
      );
      await page.goto(VALID_LINK);
      await forgotPasswordNewPasswordField(page).fill(
        "Valid-New-Password-123!",
      );
      await forgotPasswordConfirmPasswordField(page).fill(
        "Valid-New-Password-123!",
      );
      await forgotPasswordConfirmSubmitButton(page).click();

      await expect(page).toHaveURL(/\/login\/?$/);
      await expect(loginForm(page)).toBeVisible();
      await expect(globalMessageSnackbar(page)).toHaveText(
        FORGOT_PASSWORD_MESSAGES.resetSucceeded,
        { exact: true },
      );
      await expectNotAuthenticated(page);
    });

    test("link invalidated at submit time switches to invalid state without snackbar", async ({
      page,
    }) => {
      await mockValidLink(page);
      await page.route(CONFIRM_API, (route) =>
        route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            code: "password_reset_link_invalid",
            params: {},
          }),
        }),
      );
      await page.goto(VALID_LINK);
      await forgotPasswordNewPasswordField(page).fill(
        "Valid-New-Password-123!",
      );
      await forgotPasswordConfirmPasswordField(page).fill(
        "Valid-New-Password-123!",
      );
      await forgotPasswordConfirmSubmitButton(page).click();

      await expect(forgotPasswordInvalidLinkPage(page)).toBeVisible();
      await expect(forgotPasswordConfirmForm(page)).toHaveCount(0);
      await expect(globalMessageSnackbar(page)).toHaveCount(0);
    });

    test("unexpected reset failure retains both password fields and stays logged out", async ({
      page,
    }) => {
      await mockValidLink(page);
      await page.route(CONFIRM_API, (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ detail: "simulated failure" }),
        }),
      );
      await page.goto(VALID_LINK);
      const password = "Valid-New-Password-123!";
      await forgotPasswordNewPasswordField(page).fill(password);
      await forgotPasswordConfirmPasswordField(page).fill(password);
      await forgotPasswordConfirmSubmitButton(page).click();

      await expect(page).toHaveURL(/\/password-reset\/confirm/);
      await expect(globalMessageSnackbar(page)).toHaveText(
        FORGOT_PASSWORD_MESSAGES.resetFailed,
        { exact: true },
      );
      await expect(forgotPasswordNewPasswordField(page)).toHaveValue(password);
      await expect(forgotPasswordConfirmPasswordField(page)).toHaveValue(
        password,
      );
      await expectNotAuthenticated(page);
    });
  });

  test("authenticated users are redirected from both recovery routes to home", async ({
    page,
  }) => {
    await page.goto("/password-reset");
    await expect(page).toHaveURL(/\/home\/?$/);
    await page.goto("/password-reset/confirm#uid=MQ&token=valid-token");
    await expect(page).toHaveURL(/\/home\/?$/);
  });
});
