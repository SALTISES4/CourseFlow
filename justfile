#########################################################
# This justfile is a collection of all workflow orchestration scripts
#
#  - note that it does not yest replace scripts/provisioning (although that might be a goal)
#  - just cannot control iterm, or chrome etc, so these need to be triggered via osascript files (see scripts/dev_tabs.scpt)
#  -
#########################################################

import 'scripts/just/config.just'
mod django 'scripts/just/django.just'
mod docker 'scripts/just/docker.just'
mod testing 'scripts/just/testing.just'
mod toolchain 'scripts/just/toolchain.just'

set shell := ["bash", "-cu"]


# Default recipe shown when running `just`
default:
    @just --list --list-submodules

#########################################################
#  HELPER COMMANDS
#########################################################

commamd-confirm:
  @read -p "Press enter to continue or Ctrl+C to cancel..."
  @echo "Continuing..."


#########################################################
#  WORKFLOWS
#########################################################

#########################################################
# Initial project setup
# You've just cloned the repo, what do you do next?
#########################################################

# Initial project setup
[group: 'Workflows']
init:
  just checkout-dev
  just init-env

  @echo "Before continuing you must fill out the appropriate values in your .env file"
  @echo "see: https://docs.google.com/spreadsheets/d/1yyOEbXIDyuK4Mr1OmnEuCDZtw7Ym2Hi8AB5QSvuKlHU/edit?gid=0#gid=0"
  just commamd-confirm

  just docker-build
  just create-venv
  just uv-sync
  just django-migrate

  just pre-commit-install

  just init-env-frontend
  @echo ""
  @echo "Before continuing you must fill out the appropriate frontend values in your client/.env file"
  just commamd-confirm

  just frontend-install

  @echo "project should now be setup"
  @echo "try: \
    $ just dev"


# dev machine
[group: 'Workflows']
dev:
  just toolchain::uv-sync
  just docker::up
  just django::migrate
  just toolchain::iterm
  just toolchain::browsers
  just django::run

[group: 'Workflows']
rebuild-dev-db:
  just django::kill-background
  just docker::reset
  just docker::up
  just django::wait-db
  just django::migrate
  just django::create-superuser
  just testing::e2e-tests-seed
  just django::kill-background

# Prepare deterministic fixtures locally; CI owns test database isolation.
[group: 'Workflows test']
e2e-prepare:
  just docker::up
  just django::wait-db
  just django::migrate
  just testing::e2e-tests-seed


#########################################################
# Deployment
#########################################################

# Deploy the exact checked-out staging commit with a pre-built frontend artifact.
[group: 'Deployment']
deploy-staging $deploy_sha $frontend_artifact_dir:
  #!/usr/bin/env bash
  set -euo pipefail

  frontend_artifact_dir=${frontend_artifact_dir%/}

  if [[ ! "$deploy_sha" =~ ^[0-9a-f]{40}$ ]]; then
    echo "Invalid deployment commit: $deploy_sha" >&2
    exit 64
  fi

  expected_artifact_dir="/tmp/courseflow-${deploy_sha}"
  if [ "$frontend_artifact_dir" != "$expected_artifact_dir" ]; then
    echo "Unexpected frontend artifact directory: $frontend_artifact_dir" >&2
    exit 64
  fi

  cleanup() {
    rm -rf -- "$expected_artifact_dir"
  }
  trap cleanup EXIT

  repo_root=$(git rev-parse --show-toplevel)
  cd "$repo_root"

  if [ "$(git rev-parse HEAD)" != "$deploy_sha" ]; then
    echo "Refusing to deploy: checkout does not match $deploy_sha" >&2
    exit 1
  fi

  if [ ! -f .env ]; then
    echo "Refusing to deploy without $repo_root/.env" >&2
    exit 1
  fi

  if [ ! -f "$frontend_artifact_dir/index.html" ]; then
    echo "Frontend artifact does not contain index.html" >&2
    exit 1
  fi

  compose=(docker compose --profile staging)

  "${compose[@]}" config --quiet
  "${compose[@]}" build django
  "${compose[@]}" up -d --wait --wait-timeout 60 postgres
  "${compose[@]}" up -d --no-deps --no-build --force-recreate --wait --wait-timeout 180 django

  mkdir -p react/dist
  rsync --archive --delay-updates \
    "$frontend_artifact_dir/" \
    react/dist/

  test -f react/dist/index.html
  "${compose[@]}" ps

  echo "CourseFlow staging deployed at commit $deploy_sha"
