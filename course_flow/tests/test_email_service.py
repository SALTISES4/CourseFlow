from __future__ import annotations

import logging

import pytest
from django.core import mail
from django.core.exceptions import ImproperlyConfigured
from django.core.mail.backends.base import BaseEmailBackend

from course_flow.application.services.email_service import (
    PASSWORD_CHANGED_CONFIRMATION_EMAIL,
    PASSWORD_RESET_REQUEST_EMAIL,
    EmailCategory,
    EmailConfiguration,
    EmailDeliveryError,
    EmailDeliveryStatus,
    EmailLocale,
    EmailRecipient,
    EmailService,
    EmailTemplate,
    PasswordChangedConfirmationEmailContext,
    PasswordResetRequestEmailContext,
    resolve_email_locale,
)


class RejectingEmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        raise RuntimeError("backend echoed secret-token-123")


@pytest.fixture(autouse=True)
def email_settings(settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    settings.DEFAULT_FROM_EMAIL = "sender@example.com"
    settings.COURSEFLOW_SUPPORT_EMAIL = "support@example.com"
    settings.COURSEFLOW_FRONTEND_URL = "http://localhost:3000"
    settings.ENVIRONMENT = "development"


@pytest.mark.parametrize(
    ("preference", "expected"),
    [
        ("fr", EmailLocale.FR_CA),
        (" FR-ca ", EmailLocale.FR_CA),
        ("fr_CA", EmailLocale.FR_CA),
        ("en", EmailLocale.EN_CA),
        ("EN-CA", EmailLocale.EN_CA),
        (None, EmailLocale.EN_CA),
        ("", EmailLocale.EN_CA),
        ("es", EmailLocale.EN_CA),
    ],
)
def test_resolve_email_locale_uses_supported_locale_or_english_fallback(
    preference, expected
):
    assert resolve_email_locale(preference) is expected


def test_password_reset_request_is_multipart_and_uses_shared_headers():
    status = EmailService().send(
        template=PASSWORD_RESET_REQUEST_EMAIL,
        recipient=EmailRecipient(
            address="recipient@example.com",
            language_preference="en",
            optional_product_updates_enabled=False,
        ),
        category=EmailCategory.ESSENTIAL_ACTION,
        context=PasswordResetRequestEmailContext(
            reset_path="/password-reset/confirm?token=one-time-token"
        ),
    )

    assert status is EmailDeliveryStatus.SENT
    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    reset_url = (
        "http://localhost:3000/password-reset/confirm?token=one-time-token"
    )

    assert message.subject == "CourseFlow password reset request"
    assert message.from_email == "CourseFlow <sender@example.com>"
    assert message.to == ["recipient@example.com"]
    assert message.reply_to == ["support@example.com"]
    assert message.extra_headers == {
        "X-CourseFlow-Email-Category": "essential_action",
        "X-CourseFlow-Email-Template": "password-reset-request",
    }
    assert message.body == (
        "Hi there,\n\n"
        "We received a request to reset the password for your CourseFlow "
        "account. You can set a new password by clicking the button below:\n\n"
        f"Reset password: {reset_url}\n\n"
        "Important details:\n\n"
        "- Expiration: for your security, this link will expire in 24 hours.\n"
        "- Security notice: if you did not request this change, you can safely "
        "ignore this email. Your password will remain secure and unchanged.\n\n"
        "Best regards,\n\n"
        "The CourseFlow Team."
    )
    assert len(message.alternatives) == 1
    html = message.alternatives[0]
    assert html.mimetype == "text/html"
    assert f'href="{reset_url}"' in html.content
    assert ">Reset password</a>" in html.content
    assert "one-time-token" not in message.subject
    assert message.body.count("one-time-token") == 1
    assert html.content.count("one-time-token") == 1


def test_french_password_reset_request_uses_one_locale_for_all_parts():
    status = EmailService().send(
        template=PASSWORD_RESET_REQUEST_EMAIL,
        recipient=EmailRecipient(
            address="recipient@example.com",
            language_preference="fr-ca",
        ),
        category=EmailCategory.ESSENTIAL_ACTION,
        context=PasswordResetRequestEmailContext(
            reset_path="/password-reset/confirm?token=jeton"
        ),
    )

    assert status is EmailDeliveryStatus.SENT
    message = mail.outbox[0]
    html = message.alternatives[0].content
    assert message.subject == (
        "Demande de réinitialisation du mot de passe CourseFlow"
    )
    assert "Nous avons reçu une demande" in message.body
    assert "ce lien expirera dans 24 heures" in message.body
    assert ">Réinitialiser le mot de passe</a>" in html
    assert "We received a request" not in message.body
    assert "We received a request" not in html


def test_password_changed_confirmation_uses_configured_support_address(settings):
    settings.COURSEFLOW_SUPPORT_EMAIL = "security@example.com"

    status = EmailService().send(
        template=PASSWORD_CHANGED_CONFIRMATION_EMAIL,
        recipient=EmailRecipient(
            address="recipient@example.com",
            language_preference="unsupported",
        ),
        category=EmailCategory.ADVISORY_CONFIRMATION,
        context=PasswordChangedConfirmationEmailContext(),
    )

    assert status is EmailDeliveryStatus.SENT
    message = mail.outbox[0]
    assert message.subject == "Your CourseFlow password was reset"
    assert message.reply_to == ["security@example.com"]
    assert message.body == (
        "Hello,\n\n"
        "The password for your account was changed successfully.\n\n"
        "Didn't make this change? Please contact CourseFlow support "
        "immediately at security@example.com to lock your account and verify "
        "your access.\n\n"
        "Thank you,\n\n"
        "The CourseFlow Team."
    )
    assert "mailto:security@example.com" in message.alternatives[0].content


def test_optional_product_update_is_suppressed_when_preference_is_disabled():
    optional_template = EmailTemplate[PasswordChangedConfirmationEmailContext](
        key="not-rendered",
        category=EmailCategory.OPTIONAL_PRODUCT_UPDATE,
        context_type=PasswordChangedConfirmationEmailContext,
        subjects={
            EmailLocale.EN_CA: "Not rendered",
            EmailLocale.FR_CA: "Non rendu",
        },
    )

    status = EmailService().send(
        template=optional_template,
        recipient=EmailRecipient(
            address="recipient@example.com",
            optional_product_updates_enabled=False,
        ),
        category=EmailCategory.OPTIONAL_PRODUCT_UPDATE,
        context=PasswordChangedConfirmationEmailContext(),
    )

    assert status is EmailDeliveryStatus.SUPPRESSED
    assert len(mail.outbox) == 0


def test_essential_failure_raises_without_logging_token(settings, caplog):
    settings.EMAIL_BACKEND = (
        "course_flow.tests.test_email_service.RejectingEmailBackend"
    )
    caplog.set_level(
        logging.ERROR,
        logger="course_flow.application.services.email_service",
    )

    with pytest.raises(EmailDeliveryError, match="password-reset-request"):
        EmailService().send(
            template=PASSWORD_RESET_REQUEST_EMAIL,
            recipient=EmailRecipient(address="recipient@example.com"),
            category=EmailCategory.ESSENTIAL_ACTION,
            context=PasswordResetRequestEmailContext(
                reset_path="/password-reset/confirm?token=secret-token-123"
            ),
        )

    assert "secret-token-123" not in caplog.text
    assert "recipient@example.com" not in caplog.text
    assert "courseflow_email_delivery_failed" in caplog.text
    assert "template=password-reset-request" in caplog.text


def test_advisory_failure_is_recorded_without_becoming_operation_failure(
    settings, caplog
):
    settings.EMAIL_BACKEND = (
        "course_flow.tests.test_email_service.RejectingEmailBackend"
    )
    caplog.set_level(
        logging.ERROR,
        logger="course_flow.application.services.email_service",
    )

    status = EmailService().send(
        template=PASSWORD_CHANGED_CONFIRMATION_EMAIL,
        recipient=EmailRecipient(address="recipient@example.com"),
        category=EmailCategory.ADVISORY_CONFIRMATION,
        context=PasswordChangedConfirmationEmailContext(),
    )

    assert status is EmailDeliveryStatus.FAILED
    assert "courseflow_email_delivery_failed" in caplog.text


def test_template_category_and_context_are_closed_contracts():
    service = EmailService()
    recipient = EmailRecipient(address="recipient@example.com")

    with pytest.raises(ValueError, match="requires category"):
        service.send(
            template=PASSWORD_RESET_REQUEST_EMAIL,
            recipient=recipient,
            category=EmailCategory.ADVISORY_CONFIRMATION,
            context=PasswordResetRequestEmailContext(reset_path="/reset"),
        )

    with pytest.raises(TypeError, match="requires context"):
        service.send(
            template=PASSWORD_RESET_REQUEST_EMAIL,
            recipient=recipient,
            category=EmailCategory.ESSENTIAL_ACTION,
            context=PasswordChangedConfirmationEmailContext(),  # type: ignore[arg-type]
        )


def test_frontend_url_requires_https_unless_explicitly_allowed():
    configuration = EmailConfiguration(
        from_email="sender@example.com",
        support_email="support@example.com",
        frontend_origin="http://courseflow.example.com",
        allow_insecure_action_urls=False,
    )

    with pytest.raises(ImproperlyConfigured, match="must use HTTPS"):
        configuration.build_frontend_url("/password-reset/confirm?token=token")


def test_runtime_environment_not_debug_controls_action_url_security(settings):
    settings.DEBUG = True
    settings.ENVIRONMENT = "staging"
    settings.COURSEFLOW_FRONTEND_URL = "http://courseflow.example.com"
    settings.COURSEFLOW_ALLOW_INSECURE_EMAIL_ACTION_URLS = False

    configuration = EmailConfiguration.from_django_settings()

    assert configuration.allow_insecure_action_urls is False
    with pytest.raises(ImproperlyConfigured, match="must use HTTPS"):
        configuration.build_frontend_url("/password-reset/confirm?token=token")


@pytest.mark.parametrize(
    "origin",
    [
        "courseflow.example.com",
        "https://user:password@courseflow.example.com",
        "https://courseflow.example.com/application",
        "https://courseflow.example.com?tenant=courseflow",
    ],
)
def test_frontend_url_rejects_values_that_are_not_origins(origin):
    configuration = EmailConfiguration(
        from_email="sender@example.com",
        support_email="support@example.com",
        frontend_origin=origin,
        allow_insecure_action_urls=False,
    )

    with pytest.raises(ImproperlyConfigured, match=r"absolute HTTP\(S\) origin"):
        configuration.build_frontend_url("/password-reset/confirm?token=token")


@pytest.mark.parametrize(
    "path",
    [
        "password-reset/confirm?token=token",
        "https://malicious.example/reset",
        "//malicious.example/reset",
        "/reset\nBcc: attacker@example.com",
    ],
)
def test_frontend_url_rejects_non_relative_or_unsafe_action_paths(path):
    configuration = EmailConfiguration(
        from_email="sender@example.com",
        support_email="support@example.com",
        frontend_origin="https://courseflow.example.com",
        allow_insecure_action_urls=False,
    )

    with pytest.raises(ValueError, match="Email action paths"):
        configuration.build_frontend_url(path)
