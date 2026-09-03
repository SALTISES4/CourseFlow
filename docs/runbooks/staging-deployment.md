# Staging deployment

CourseFlow staging deploys automatically when a commit reaches the `staging`
branch. CircleCI tests the backend, builds the frontend once, and deploys the
exact tested commit. A failed test or frontend build prevents deployment.

This workflow is intentionally staging-only. The current Docker image starts
Django with `manage.py runserver`; that is not an acceptable production WSGI
server. Do not enable the same workflow for `master` until the production
runtime, health endpoint, rollback policy, and deployment topology are defined.

## Release sequence

1. Run the Python test suite against PostgreSQL 16.
2. Run the frontend translation checks and production Vite build.
3. Upload `react/dist` to a commit-specific temporary directory on the server.
4. Refuse deployment if the server checkout has tracked changes.
5. Fetch and fast-forward the server's `staging` branch to the exact CircleCI
   commit. The job does not use an unbounded `git pull`.
6. Build the Django image, ensure PostgreSQL is healthy, recreate only Django,
   and wait for the Django container health check.
7. Replace the served files in `react/dist` with the tested frontend artifact.

The frontend sync retains older content-hashed assets so a browser that loaded
the previous HTML immediately before a deployment can still fetch its bundle.
Those immutable files can be cleaned in a separate retention task; cleanup is
not part of the release-critical path.

The deployment job is in a CircleCI serial group, so two staging releases
cannot run concurrently. The frontend is activated only after Django is
healthy. This reduces, but does not eliminate, the mixed-version interval
during a migration. Migrations that are incompatible with the previous
frontend or backend still require an explicit maintenance or expand-contract
release plan.

## CircleCI setup

Replace the explicit `SET_COURSEFLOW_...` values in the
`staging-deployment` workflow invocation:

| Variable | Purpose |
| --- | --- |
| `DEPLOY_HOST` | SSH hostname or IPv4 address of the staging server, without a port |
| `DEPLOY_USER` | Dedicated, non-root deployment account |
| `DEPLOY_PATH` | Absolute path of the existing CourseFlow checkout, without spaces |
| `DEPLOY_KNOWN_HOSTS` | Verified OpenSSH `known_hosts` line for `DEPLOY_HOST` |
| `SSH_FINGERPRINT` | Fingerprint of the CourseFlow staging key added to CircleCI |
| `VITE_API_BASE_URL` | Optional public Django API origin; omit for same-origin `/api` requests |

Add the deployment account's private SSH key under the CourseFlow CircleCI
project’s **Project Settings > SSH Keys > Additional SSH Keys**. Install its
public key for the deployment account on the server. Put the fingerprint shown
by CircleCI in the workflow's explicit `SSH_FINGERPRINT` parameter. The job
loads only that key and requires strict host-key verification; it does not use
`StrictHostKeyChecking=no`.

The deployment coordinates, public API URL, host public key, and SSH key
fingerprint are environment-specific configuration rather than secrets, so
they remain visible in the workflow invocation. Use a restricted CircleCI
context only when the workflow gains actual secrets or integration credentials
such as Slack tokens. Runtime application and database secrets remain in the
server-managed `.env`.

Obtain the host key outside CircleCI and verify its fingerprint through a
separate trusted channel before storing the complete line in
`DEPLOY_KNOWN_HOSTS`. Do not trust an `ssh-keyscan` result collected inside the
deployment job.

The deploy job opts into CircleCI's fixed outbound IP ranges. The server
firewall must allow SSH from the current CircleCI ranges and should not expose
SSH broadly.

## Server prerequisites

- An existing clean clone at `DEPLOY_PATH`, with an `origin` remote that can
  fetch the private repository.
- A persistent, server-managed `.env` at the repository root. CircleCI never
  copies this file.
- Docker Engine, Docker Compose v2 with `--wait` support, Just, Git, and rsync.
- Permission for `DEPLOY_USER` to run this repository's Docker Compose stack.
- Nginx (or the current static server) configured to serve
  `<DEPLOY_PATH>/react/dist`.
- The deployment public key restricted to this server and environment. Do not
  reuse a production key.

Access to a rootful Docker daemon is effectively root access even when
`DEPLOY_USER` is not named `root`. This staging workflow therefore does not by
itself create a production-grade privilege boundary. Production should use a
root-owned, fixed-command deployment wrapper or a comparably constrained
runner rather than grant a general CI key an unrestricted shell.

Before enabling the workflow, run the server-side prerequisites manually and
confirm that `docker compose --profile staging config --quiet` succeeds from
`DEPLOY_PATH`.

## Failure behavior

- Dirty checkout, unresolved deployment markers, mismatched SSH host key, non-fast-
  forward Git state, invalid artifact, failed image build, failed migration, or
  unhealthy Django all stop the release.
- The frontend is not replaced if the Django container does not become healthy.
- Database migrations are not automatically rolled back. A migration failure
  requires inspection before retrying; rerunning an older pipeline is not a
  safe database rollback strategy.
- CircleCI reports the commit SHA deployed by the server-side Just recipe. Runtime
  verification should compare that SHA with the pipeline commit.
