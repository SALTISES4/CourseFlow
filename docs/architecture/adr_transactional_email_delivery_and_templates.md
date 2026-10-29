# ADR: Transactional email delivery and templates

**Status:** Accepted

**Date:** 2026-10-28
**Scope:** CourseFlow V2 user-facing email, Django rendering, Amazon SES delivery, localization, and automated testing

## Context

CourseFlow V2 already configures `django-ses` as its production Django email backend when `AWS_SES_REGION_NAME` is present, and AWS infrastructure grants the application instance role permission to send from the configured SES identity. The current application does not yet have a reusable email service, email templates, multipart rendering, or email-specific tests.

Password recovery introduces the first V2 transactional emails:

- an essential password-reset link email, without which the recipient cannot continue recovery;
- an advisory password-change confirmation email, sent after the credential change has completed.

Feature requirements define exact user-visible behavior and copy. Technical delivery, template organization, sender configuration, localization, and failure semantics need one architecture contract so later email features do not create bespoke sending paths.

## Decision

### 1. Django owns rendering and delivery orchestration

User-facing email is sent through one application-level email service. Feature services request a message by template key, recipient, resolved account locale, category, and typed template context. Feature code does not call the Django email backend directly or assemble HTML strings inline.

The service uses Django's email APIs and `EmailMultiAlternatives` to produce a multipart message containing:

- a `text/plain` body;
- a semantically equivalent `text/html` alternative.

### 2. Templates are file-backed and localized explicitly

Email templates live under `course_flow/templates/email/` and use this shape:

```text
email/
  base.html
  en-CA/<template-key>.txt
  en-CA/<template-key>.html
  fr-CA/<template-key>.txt
  fr-CA/<template-key>.html
```

The shared HTML base owns common CourseFlow presentation. Message templates own feature copy and action content. Locale-specific template pairs are explicit files so transactional copy can be reviewed without relying on the React translation runtime or a message-compilation step that the backend does not currently have.

The service normalizes account preferences `en`, `en-ca`, `fr`, and `fr-ca` to `en-CA` or `fr-CA`. Missing or unsupported values fall back to `en-CA`. Subject, plain text, HTML, and action label for one message use the same resolved locale.

### 3. Sender, support, and public origins are configuration

- `DEFAULT_FROM_EMAIL` remains the SES-verified envelope/from address configured per environment.
- The displayed From identity is `CourseFlow <DEFAULT_FROM_EMAIL>`.
- `COURSEFLOW_SUPPORT_EMAIL` supplies the Reply-To address and any rendered support address. It defaults to `admin@courseflow.com` but remains environment-configurable.
- `COURSEFLOW_FRONTEND_URL` supplies the canonical frontend origin used to build absolute email action URLs. Non-development configuration must use HTTPS.

Templates must not hardcode deployment hostnames, sender addresses, or support addresses.

The support address is deliberately separate from `DEFAULT_FROM_EMAIL`. Current AWS IAM policy restricts SES sending to the infrastructure-configured From address, so changing `COURSEFLOW_SUPPORT_EMAIL` must not silently change the sending identity. Using `admin@courseflow.com` as the From address as well would require an explicit `DEFAULT_FROM_EMAIL` deployment change and a compatible verified SES identity.

### 4. Email categories control preferences and failure semantics

The email service accepts an explicit category:

- `essential_action`: required to continue an operation, such as a password-reset link;
- `advisory_confirmation`: reports an operation already committed, such as a password-change confirmation;
- `optional_product_update`: controlled by the user's product-update preference.

Authentication, account-security, and service-operation emails are not suppressed by the optional product-update preference.

Password-reset link delivery is synchronous for the initial implementation because no durable background-work queue exists and the feature must distinguish backend acceptance from delivery failure. If the configured backend rejects the message, the request endpoint returns its feature-defined failure result.

Password-change confirmation delivery is best effort. It occurs only after the password update commits. Delivery failure is caught and recorded, but does not roll back the password change, token revocation, or successful user-facing outcome.

Moving delivery to a durable outbox or background worker requires a later ADR because it changes retry, idempotency, observability, and feature failure semantics.

### 5. Security constraints

- Passwords and other reusable credentials are never rendered into email.
- A one-time recovery token appears only within the reset action URL.
- Rendered message bodies and token-bearing URLs are not written to application logs.
- Template values use Django auto-escaping in HTML and are treated as data rather than trusted markup.
- Feature-specific rate limits and token expiry remain defined by the password-recovery requirements and Django authentication configuration.

### 6. Testing boundary

Automated tests use Django's in-memory email backend and do not call Amazon SES.

Tests assert, as applicable:

- recipient, From, and Reply-To headers;
- resolved locale;
- subject;
- presence and semantic equivalence of text and HTML alternatives;
- action label and absolute URL;
- essential-versus-advisory delivery-failure behavior;
- absence of raw passwords from rendered messages.

Amazon SES identity verification, account production access, IAM permission, and live deliverability are deployment/operational checks rather than unit- or browser-test responsibilities.

## Consequences

- Password email work establishes a reusable but deliberately narrow transactional-email boundary.
- Feature requirements continue to own message triggers and exact content; the global email requirement owns cross-feature behavior.
- Production remains dependent on the configured SES identity and sender restriction already represented in infrastructure.
- `admin@courseflow.com` is the default monitored Reply-To/support address, not an assumption that the same address is already authorized as the SES From identity.
- Explicit locale template pairs add reviewable duplication, but avoid coupling backend email to React catalogues or introducing an unconfigured Django gettext compilation pipeline.
- Synchronous essential delivery can increase request latency; this is accepted until a durable asynchronous design is adopted.

## References

- Global functional behavior: `tests/docs/requirements/features/global/email_communication_requirements_v1.yaml`
- Password recovery: `tests/docs/requirements/features/auth/forgot_password_requirements_v1.yaml`
- Password-recovery tokens and rate limits: `docs/architecture/adr_password_recovery_tokens_and_rate_limits.md`
- Authenticated password change: `tests/docs/requirements/features/auth/password_reset_requirements_v1.yaml`
- Password-change session invalidation: `docs/architecture/adr_credential_version_and_password_change_sessions.md`
- Email backend configuration: `course_flow/settings.py`
- AWS SES permission and sender restriction: `../saltise-infra/courseflow/cloudformation/core.yml`
