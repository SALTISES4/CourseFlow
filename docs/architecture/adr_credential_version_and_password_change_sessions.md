# ADR: Credential version and password-change session invalidation

**Status:** Accepted

**Date:** 2026-10-28
**Scope:** CourseFlow V2 password changes, bearer-token validity, concurrent login, and password-change confirmation email

## Context

An authenticated password change must preserve the bearer token used to submit
the change, revoke every other active token for the account, and attempt the
advisory password-change confirmation email only after the database changes
commit. The current password mutation updates only the password hash.

Updating `revoked_at` is necessary for explicit per-token audit state, but a
credential generation supplies a second invariant: a token issued for an older
credential state cannot authenticate even if an invalidation update misses it.
Credential validation, token issuance, and password change must also serialize
on the same user row. Version comparison alone does not prevent a login from
validating an old password immediately before a password change and issuing a
new token immediately afterward.

## Decision

### 1. Credential version is part of user and token validity

`User.credential_version` and `Authtoken.credential_version` are non-null,
positive integers. New users begin at version `1`. Every issued token copies
the user's current version.

A bearer token is valid only when all of these conditions hold:

- it exists;
- it is not revoked;
- it is not expired;
- its credential version equals the owning user's credential version.

A version mismatch is exposed to clients as a revoked token. `revoked_at`
remains the authoritative per-token audit marker for explicit logout and
password-change invalidation; credential version is a fail-closed validity
invariant, not a replacement for that marker.

### 2. Login and password change serialize on the user row

Password validation and token issuance during login occur in one database
transaction while holding `SELECT ... FOR UPDATE` on the user row.

Authenticated password change acquires the same user lock, then locks and
revalidates the submitting token before changing security state. This ordering
prevents a login validated with the old password from creating a surviving
token after the password change.

### 3. Password change is one atomic security operation

Within one transaction, authenticated password change:

1. validates the current password and new-password rules;
2. increments the user's credential version;
3. stores the new password hash;
4. advances the submitting token to the new credential version;
5. sets `revoked_at` on every other unrevoked, unexpired token.

The submitting token remains active. Invalid input or invalid submitting-token
state changes none of the password or token records.

### 4. Confirmation email runs after commit

The password-change confirmation is registered with `transaction.on_commit()`
using the shared advisory email category. Rendering or delivery failure is
recorded by the email service but cannot roll back the committed password or
token changes and does not change the successful API response.

There is no durable email outbox in this decision. A process failure after the
database commit but before delivery can lose this advisory email, consistent
with the accepted transactional-email ADR.

### 5. Migration deliberately performs no backfill

The schema migration first adds both credential-version columns as `NOT NULL`
without a database or migration default. It contains no data migration and no
legacy compatibility path.

Deployment precondition: every target database must contain no user or auth
token rows that need to survive, or it must be reset before this migration is
applied. If legacy rows exist, the migration is expected to fail rather than
invent credential versions or silently preserve legacy sessions.

Application-level defaults apply only to objects created after the schema is
installed. They are introduced after the no-default column additions and do
not authorize a backfill.

## Consequences

- Password change and login share an explicit concurrency boundary.
- A missed revocation update still fails closed through version comparison.
- Current-session preservation is explicit rather than an accidental exception.
- Direct token creation outside the authentication service is unsupported
  application behavior; the authentication service always copies the current
  user version.
- Environments with legacy CourseFlow V2 user or token rows must be reset; they
  are not migrated.

## References

- Authenticated password-change behavior: `tests/docs/requirements/features/auth/password_reset_requirements_v1.yaml`
- Transactional email behavior: `docs/architecture/adr_transactional_email_delivery_and_templates.md`
- Bearer authentication: `course_flow/api/auth.py`
- Token model: `course_flow/core/models/authtoken.py`
