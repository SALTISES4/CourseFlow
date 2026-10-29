# ADR: Password-recovery tokens and rate limits

**Status:** Accepted

**Date:** 2026-10-28
**Scope:** Logged-out CourseFlow password recovery, reset-link security, request throttling, and session invalidation

## Context

Logged-out password recovery needs a 24-hour, single-use reset link and rolling
one-hour request limits of five attempts per normalized email and twenty attempts
per originating client IP. CourseFlow has no shared cache or background worker.
An in-process limiter would reset on deployment and disagree across workers, and
an unlocked database count followed by insert can exceed the limits under
concurrent requests.

Reset tokens must not be stored or written to application, proxy, analytics, or
referrer logs. Request responses must not disclose whether an active account
exists.

## Decision

### 1. Use Django's password-reset token generator

Recovery links use an encoded user ID and Django's signed
`PasswordResetTokenGenerator`, with `PASSWORD_RESET_TIMEOUT` set to 24 hours.
The token is invalidated by a successful password change and is revalidated
while holding the user-row lock before any security state changes.

The SPA receives the encoded user ID and token in the URL fragment:

```text
/password-reset/confirm#uid=<encoded-user-id>&token=<signed-token>
```

Fragments are not sent in HTTP requests or referrer headers. The frontend reads
the fragment and submits its values in API request bodies.

### 2. Persist HMAC request fingerprints

Every syntactically valid request records one `PasswordResetAttempt` containing:

- an HMAC-SHA256 fingerprint of the trimmed, lowercased email address;
- an HMAC-SHA256 fingerprint of the canonical client IP address;
- the request timestamp.

Raw email addresses and client IPs are not stored in the limiter table. The HMAC
key comes from `PASSWORD_RESET_RATE_LIMIT_SECRET`, which defaults to the Django
secret key. Rows older than one day are deleted opportunistically.

### 3. Serialize rolling-window evaluation in PostgreSQL

The service takes transaction-scoped PostgreSQL advisory locks for the email and
IP fingerprints in stable numeric order. While holding both locks it counts
attempts newer than one hour, records the current attempt, and decides whether
the request is eligible.

The first five email attempts and first twenty IP attempts in the rolling window
are eligible. A request exceeding either limit is accepted but sends no email.
Unknown and inactive accounts are evaluated and recorded identically.

### 4. Trust forwarded client IP only in configured proxy environments

By default the API uses `REMOTE_ADDR`. When
`COURSEFLOW_TRUST_PROXY_CLIENT_IP=true`, it uses the first valid address in
`X-Forwarded-For`, falling back to `REMOTE_ADDR`. AWS enables this setting because
the Django container is reachable only through the managed Caddy reverse proxy.
Caddy is the public first hop and, by default, discards client-supplied
`X-Forwarded-*` values before setting its upstream headers, so the first address
cannot be selected by the caller.

This contract must be revisited before placing a CDN, load balancer, or another
proxy in front of Caddy. An additional proxy normally appends addresses and
requires an explicitly configured trusted-proxy chain plus right-to-left client
IP resolution; continuing to trust the leftmost value would permit spoofing.

### 5. Confirmation is an atomic account-security operation

Password-reset confirmation locks the user, revalidates the signed token,
validates the new password, increments credential version, changes the password,
and revokes every active access token in one transaction. It preserves no token
and issues no new session.

The advisory password-change confirmation email is registered with a robust
post-commit callback. Its failure cannot roll back recovery or change the API
success outcome.

### 6. Capture local and CI email with Mailpit

Development and browser-test environments deliver SMTP to Mailpit. The
Mailpit-backed Playwright journey retrieves the message through Mailpit's HTTP
API, follows the generated reset link, changes the password, verifies that the
link is single-use, and verifies the replacement credentials.

HTTP action URLs are permitted only through the explicit
`COURSEFLOW_ALLOW_INSECURE_EMAIL_ACTION_URLS` setting. Development defaults it
on and the isolated CI Compose stack sets it directly; managed environments
leave it off and therefore require HTTPS.

Mailpit is a test inbox, not an AWS SES emulator. AWS environments continue to
use `django-ses`, and live SES acceptance remains required to validate IAM,
verified identities, provider rejection, and actual delivery.

## Migration policy

The limiter migration creates a new table and indexes. It has no backfill and
does not alter or preserve legacy recovery data.

## Consequences

- Reset links need no token table or cleanup job.
- Rate limits remain correct across processes and deployments.
- Rate-limit correctness is intentionally PostgreSQL-specific.
- Rotating the rate-limit HMAC secret starts new logical rate-limit buckets.
- A process failure after reset commit can lose the advisory confirmation email;
  no durable email outbox is introduced.
- Local and CI browser tests cover the SMTP and MIME boundary without sending
  mail to an external recipient, but do not establish AWS SES parity.

## Technical debt and rollout follow-ups

These items remain outstanding. The environment configuration, migration,
commit, and deployment items are rollout work rather than architectural debt,
but are tracked here so the accepted design is not mistaken for a completed
production rollout.

1. Apply migrations `0024` and `0025` in each target environment. They have not
   been run.
2. Configure the target SES identity, sender and support addresses, recovery
   secret, frontend URL, and proxy-trust setting.
3. Verify that the UAT Nginx configuration overwrites `X-Forwarded-For` before
   enabling trusted proxy IPs. AWS Caddy's documented default is to ignore
   incoming spoofable forwarded values and generate its own proxy headers. See
   the [Caddy reverse-proxy documentation](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).
4. Perform the real SES delivery test, including inbox rendering and following
   the delivered reset link.
5. Run the authenticated-user redirect browser case against a provisioned E2E
   environment. The implementation exists, but the case requires authenticated
   fixture state.
6. Commit and deploy after review and explicit authorization.

## References

- Requirements: `tests/docs/requirements/features/auth/forgot_password_requirements_v1.yaml`
- Credential invalidation: `docs/architecture/adr_credential_version_and_password_change_sessions.md`
- Email delivery: `docs/architecture/adr_transactional_email_delivery_and_templates.md`
