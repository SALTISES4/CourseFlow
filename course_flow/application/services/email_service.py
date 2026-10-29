from __future__ import annotations

import logging
from dataclasses import dataclass
from email.utils import formataddr
from enum import StrEnum
from types import MappingProxyType
from typing import Generic, Mapping, Protocol, TypeVar
from urllib.parse import urljoin, urlsplit

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


class EmailCategory(StrEnum):
    ESSENTIAL_ACTION = "essential_action"
    ADVISORY_CONFIRMATION = "advisory_confirmation"
    OPTIONAL_PRODUCT_UPDATE = "optional_product_update"


class EmailDeliveryStatus(StrEnum):
    SENT = "sent"
    SUPPRESSED = "suppressed"
    FAILED = "failed"


class EmailLocale(StrEnum):
    EN_CA = "en-CA"
    FR_CA = "fr-CA"


class EmailDeliveryError(RuntimeError):
    """The configured backend did not accept an essential email."""


@dataclass(frozen=True, slots=True)
class EmailRecipient:
    address: str
    language_preference: str | None = None
    optional_product_updates_enabled: bool = False


@dataclass(frozen=True, slots=True)
class EmailConfiguration:
    from_email: str
    support_email: str
    frontend_origin: str
    allow_insecure_action_urls: bool

    @classmethod
    def from_django_settings(cls) -> EmailConfiguration:
        return cls(
            from_email=str(settings.DEFAULT_FROM_EMAIL).strip(),
            support_email=str(settings.COURSEFLOW_SUPPORT_EMAIL).strip(),
            frontend_origin=str(settings.COURSEFLOW_FRONTEND_URL).strip(),
            allow_insecure_action_urls=bool(
                settings.COURSEFLOW_ALLOW_INSECURE_EMAIL_ACTION_URLS
            ),
        )

    @property
    def displayed_from_email(self) -> str:
        return formataddr(("CourseFlow", self.from_email))

    def build_frontend_url(self, path: str) -> str:
        origin = urlsplit(self.frontend_origin)
        if (
            origin.scheme not in {"http", "https"}
            or not origin.netloc
            or origin.username is not None
            or origin.password is not None
            or origin.path not in {"", "/"}
            or origin.query
            or origin.fragment
        ):
            raise ImproperlyConfigured(
                "COURSEFLOW_FRONTEND_URL must be an absolute HTTP(S) origin "
                "without a path, query, or fragment."
            )
        if not self.allow_insecure_action_urls and origin.scheme != "https":
            raise ImproperlyConfigured(
                "COURSEFLOW_FRONTEND_URL must use HTTPS unless insecure email "
                "action URLs are explicitly enabled."
            )

        action = urlsplit(path)
        if action.scheme or action.netloc or not path.startswith("/"):
            raise ValueError("Email action paths must be application-relative paths.")
        if "\r" in path or "\n" in path:
            raise ValueError("Email action paths must not contain line breaks.")

        return urljoin(f"{self.frontend_origin.rstrip('/')}/", path.lstrip("/"))


class EmailTemplateContext(Protocol):
    def as_template_context(
        self, configuration: EmailConfiguration
    ) -> Mapping[str, object]: ...


@dataclass(frozen=True, slots=True)
class PasswordResetRequestEmailContext:
    reset_path: str

    def as_template_context(
        self, configuration: EmailConfiguration
    ) -> Mapping[str, object]:
        return {
            "reset_url": configuration.build_frontend_url(self.reset_path),
        }


@dataclass(frozen=True, slots=True)
class PasswordChangedConfirmationEmailContext:
    def as_template_context(
        self, configuration: EmailConfiguration
    ) -> Mapping[str, object]:
        return {}


ContextT = TypeVar("ContextT", bound=EmailTemplateContext)


@dataclass(frozen=True, slots=True)
class EmailTemplate(Generic[ContextT]):
    key: str
    category: EmailCategory
    context_type: type[ContextT]
    subjects: Mapping[EmailLocale, str]

    def __post_init__(self) -> None:
        missing_locales = set(EmailLocale).difference(self.subjects)
        if missing_locales:
            missing = ", ".join(sorted(locale.value for locale in missing_locales))
            raise ValueError(
                f"Template {self.key!r} is missing subjects for: {missing}."
            )

    def subject_for(self, locale: EmailLocale) -> str:
        return self.subjects[locale]


PASSWORD_RESET_REQUEST_EMAIL = EmailTemplate[
    PasswordResetRequestEmailContext
](
    key="password-reset-request",
    category=EmailCategory.ESSENTIAL_ACTION,
    context_type=PasswordResetRequestEmailContext,
    subjects=MappingProxyType(
        {
            EmailLocale.EN_CA: "CourseFlow password reset request",
            EmailLocale.FR_CA: (
                "Demande de réinitialisation du mot de passe CourseFlow"
            ),
        }
    ),
)

PASSWORD_CHANGED_CONFIRMATION_EMAIL = EmailTemplate[
    PasswordChangedConfirmationEmailContext
](
    key="password-changed-confirmation",
    category=EmailCategory.ADVISORY_CONFIRMATION,
    context_type=PasswordChangedConfirmationEmailContext,
    subjects=MappingProxyType(
        {
            EmailLocale.EN_CA: "Your CourseFlow password was reset",
            EmailLocale.FR_CA: (
                "Votre mot de passe CourseFlow a été réinitialisé"
            ),
        }
    ),
)


def resolve_email_locale(language_preference: str | None) -> EmailLocale:
    normalized = (language_preference or "").strip().replace("_", "-").lower()
    if normalized in {"fr", "fr-ca"}:
        return EmailLocale.FR_CA
    return EmailLocale.EN_CA


class EmailService:
    def send(
        self,
        *,
        template: EmailTemplate[ContextT],
        recipient: EmailRecipient,
        category: EmailCategory,
        context: ContextT,
    ) -> EmailDeliveryStatus:
        if category is not template.category:
            raise ValueError(
                f"Template {template.key!r} requires category "
                f"{template.category.value!r}."
            )
        if not isinstance(context, template.context_type):
            raise TypeError(
                f"Template {template.key!r} requires context "
                f"{template.context_type.__name__}."
            )
        if (
            category is EmailCategory.OPTIONAL_PRODUCT_UPDATE
            and not recipient.optional_product_updates_enabled
        ):
            return EmailDeliveryStatus.SUPPRESSED

        locale = resolve_email_locale(recipient.language_preference)
        configuration = EmailConfiguration.from_django_settings()

        try:
            message = self._build_message(
                template=template,
                recipient=recipient,
                locale=locale,
                category=category,
                context=context,
                configuration=configuration,
            )
            accepted = message.send(fail_silently=False)
            if accepted != 1:
                raise EmailDeliveryError("The email backend accepted no message.")
        except Exception as exc:
            # Do not record the recipient, rendered content, URL, token, or backend
            # exception text. Some backend errors echo the message payload.
            logger.error(
                "courseflow_email_delivery_failed template=%s category=%s "
                "exception_type=%s",
                template.key,
                category.value,
                type(exc).__name__,
            )
            if category is EmailCategory.ESSENTIAL_ACTION:
                raise EmailDeliveryError(
                    f"The backend did not accept essential email {template.key!r}."
                ) from None
            return EmailDeliveryStatus.FAILED

        return EmailDeliveryStatus.SENT

    def _build_message(
        self,
        *,
        template: EmailTemplate[ContextT],
        recipient: EmailRecipient,
        locale: EmailLocale,
        category: EmailCategory,
        context: ContextT,
        configuration: EmailConfiguration,
    ) -> EmailMultiAlternatives:
        template_context = {
            **context.as_template_context(configuration),
            "locale": locale.value,
            "support_email": configuration.support_email,
        }
        template_root = f"email/{locale.value}/{template.key}"
        plain_body = render_to_string(f"{template_root}.txt", template_context).strip()
        html_body = render_to_string(f"{template_root}.html", template_context).strip()

        message = EmailMultiAlternatives(
            subject=template.subject_for(locale),
            body=plain_body,
            from_email=configuration.displayed_from_email,
            to=[recipient.address],
            reply_to=[configuration.support_email],
            headers={
                "X-CourseFlow-Email-Category": category.value,
                "X-CourseFlow-Email-Template": template.key,
            },
        )
        message.attach_alternative(html_body, "text/html")
        return message
