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
  just uv-sync
  just docker-up
  just django-migrate
  just iterm
  just browsers
  just django-run

[group: 'Workflows']
rebuild-dev-db:
  just django-kill-background
  just docker-reset
  just docker-up
  just django-wait-db
  just django-migrate
  just django-create-superuser
  just django-seed-e2e-tests
  just django-kill-background

# Prepare deterministic fixtures locally; CI owns test database isolation.
[group: 'Workflows test']
e2e-prepare:
  just docker-up
  just django-wait-db
  just django-migrate
  just django-seed-e2e-tests
