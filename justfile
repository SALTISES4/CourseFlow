# ----------------------------
# This justfile is a collection of all workflow orchestration scripts
#
#  - note that it does not yest replace scripts/provisioning (although that might be a goal)
#  - just cannot control iterm, or chrome etc, so these need to be triggered via osascript files (see scripts/dev_tabs.scpt)
#  -
# ----------------------------

set shell := ["bash", "-cu"]

# Default recipe shown when running `just`
default:
    @just --list

#########################################################
#  VARIABLES / CONFIG
#########################################################

repo_root := `pwd`
compose_cmd := "docker compose"
dev_profile := "dev"

frontend_dir := "react"

# Dedicated websocket/app log files (outside docker stderr)
py_log_file := "logs/python.log"

# Infra services you want Compose to manage in dev
infra_services := "postgres"

# we need to use volta because nvm doens't play very well in
# docker etc.
frontend_bootstrap := "\
    export VOLTA_HOME=\"$HOME/.volta\" &&\
    export PATH=\"$VOLTA_HOME/bin:$PATH\" &&\
    cd react"


#########################################################
# DEPS
#########################################################
# volta is the node environment manager
[group: 'deps']
install-volta:
    brew install volta

# install the precommit hooks which run on git commit
[group: 'deps']
pre-commit-install:
    pre-commit pre-commit install --install-hooks

[group: 'deps']
install-repomix:
    brew install repomix

#########################################################
#  SINGLE COMMAND GROUPS
#########################################################


commamd-confirm:
  @read -p "Press enter to continue or Ctrl+C to cancel..."
  @echo "Continuing..."

# ----------------------------
# Help / inspection
# ----------------------------
[group: 'aux']
export-xml:
    repomix --include "./course_flow,./tests,./react,./docs,./cursor,./circleci"  -o ./assets/repomix.xml --ignore ./assets/

# ----------------------------
# VCS
# ----------------------------
[group: 'VCS']
checkout-dev:
  git checkout develop

[group: 'VCS']
pull-dev: checkout-dev
  git pull

# ----------------------------
# ENVs and template files init
# ----------------------------

# copy the default root env file template to .env
[group: 'template init']
init-env:
  if [ ! -f .env ]; then \
    cp .env.default .env \
  fi


# copy the vite .env file template
[group: 'template init']
init-env-frontend:
  cd {{ frontend_dir }} \
  if [ ! -f .env ]; then \
    cp .env.default .env \
  fi
# ----------------------------
# Docker
# ----------------------------

[group: 'docker aliases']
docker-build:
  {{ compose_cmd }} --profile {{ dev_profile }} up -d --build

[group: 'docker aliases']
docker-up:
  {{ compose_cmd }} --profile {{ dev_profile }} up -d {{ infra_services }}

[group: 'docker aliases']
docker-stop:
  {{ compose_cmd }} --profile {{ dev_profile }} stop {{ infra_services }}

[group: 'docker aliases']
docker-logs:
  {{ compose_cmd }} --profile {{ dev_profile }} logs -f {{ infra_services }}

[group: 'docker aliases']
docker-down:
  {{ compose_cmd }} down

[group: 'docker aliases']
docker-restart:
  {{ compose_cmd }} --profile {{ dev_profile }} up -d --force-recreate {{ infra_services }}

[group: 'docker aliases']
docker-reset:
  {{ compose_cmd }} down -v

# ----------------------------
# Django
# ----------------------------

[group: 'Django']
django-migrate:
  uv run python manage.py migrate

[group: 'Django']
django-make-migrate:
  uv run python manage.py makemigrations

[group: 'Django']
django-run:
  uv run python manage.py runserver

[group: 'Django']
django-run-background:
   uv run python manage.py runserver 127.0.0.1:8000 > logs/django.log 2>&1 &

[group: 'Django']
django-kill-background:
  pkill -f "manage.py runserver" || true

[group: 'Django']
django-create-superuser:
  DJANGO_SUPERUSER_EMAIL=admin@courseflow.com DJANGO_SUPERUSER_PASSWORD='password' uv run python manage.py createsuperuser --noinput

[group: 'Django']
django-wait-db:
  bash -lc 'for i in {1..60}; do \
    uv run python manage.py showmigrations --plan >/dev/null 2>&1 \
      && exit 0; \
    sleep 2; \
  done; echo "DB not ready"; exit 1'

# ----------------------------
# Backend
# ----------------------------

# Create .venv once for all workflows (dev, E2E, pytest). IDE interpreters
# (e.g. PyCharm) are bound to this path.
# Recreates only when .venv/bin/python is missing (e.g. stale symlink to removed /usr/local/bin/python3).
[group: 'Backend']
create-venv:
  #!/usr/bin/env bash
  set -euo pipefail
  if ! command -v uv >/dev/null 2>&1; then
    pip install uv
  fi
  if [ -d .venv ] && ! .venv/bin/python -c "import sys" 2>/dev/null; then
    echo ".venv exists but its Python interpreter is missing or broken — recreating with uv-managed 3.12."
    rm -rf .venv
  fi
  if [ -d .venv ]; then
    echo ".venv already exists — keeping it."
  else
    uv venv .venv --python 3.12
  fi

[group: 'Backend']
uv-sync: create-venv
  uv sync --all-extras

[group: 'Backend']
logs:
  tail -f -n50 {{ py_log_file }}


# ----------------------------
# Frontend
# ----------------------------

[group: 'Frontend']
frontend-install:
  {{ frontend_bootstrap }} && yarn


[group: 'Frontend']
frontend-dev:
  {{ frontend_bootstrap }} && yarn dev


[group: 'Frontend']
frontend-openapi-codegen:
  {{ frontend_bootstrap }} && yarn run openapi-ts && yarn run eslint --fix ./src/api/gen


#########################################################
#  TESTING
#########################################################

#########################################################
#  TESTING : SETUP
#########################################################

# Deterministic fixtures for local development and Playwright E2E.
[group: 'Testing:setup']
django-seed-e2e-tests:
  uv run cf-seed-e2e-data --clear-and-seed --manifest-path tests/.playwright-fixtures/workflow.json

[group: 'Testing:setup']
django-clear-e2e-tests:
  uv run cf-seed-e2e-data --clear


#########################################################
#  TESTING : RUN
#########################################################

# run all the precommit hooks including (ruff, safety) see .pre-commit-config.yaml
[group: 'Testing:run']
pre-commit-run:
  pre-commit run

[group: 'Testing:run']
test:
  uv run pytest

[group: 'Testing:run']
test-unit:
  uv run pytest tests/unit_tests

[group: 'Testing:run']
typecheck:
  uv run pyright


#########################################################
# APPLE SCRIPTS
#########################################################

# launch iterm
[group: 'Applescripts']
iterm:
  osascript scripts/applescript/iterm_tabs.scpt "{{ repo_root }}"

# launch chrome browser
[group: 'Applescripts']
browsers:
  osascript scripts/applescript/browser_tabs.scpt "{{ repo_root }}"

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

# ----------------------------
#
# ----------------------------

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
