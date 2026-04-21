# ----------------------------
# This justfile is a collection of all workflow orchestration scripts
#
#  - note that it does not yest replace scripts/provisioning (although that might be a goal)
#  - it does not replace entrypoint scripts defined in pyproject ('main' executables of the BB app), but it may wrap them
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

# replade this with volta
frontend_bootstrap := 'cd {{ frontend_dir }} && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use'


#########################################################
#  SINGLE COMMAND GROUPS
#########################################################


commamd-confirm:
  @read -p "Press enter to continue or Ctrl+C to cancel..."
  @echo "Continuing..."

# ----------------------------
# Help / inspection
# ----------------------------


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
django-run:
  uv run python manage.py runserver

[group: 'Django']
django-create-superuser:
  uv run python manage.py createsuperuser

[group: 'Django']
django-seed-graph:
  uv run cf2-seed-dev-data

# ----------------------------
# Backend
# ----------------------------

# create the python virtual env
[group: 'Backend']
create-venv:
  pip install uv
  uv venv .venv

[group: 'Backend']
uv-sync:
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
frontend-gen-openapi:
  {{ frontend_bootstrap }} && yarn run openapi-ts && yarn run eslint --fix ./src/api/gen

# ----------------------------
# Quality / validation
# ----------------------------

[group: 'Quality']
pre-commit-install:
  pre-commit pre-commit install --install-hooks

# run all the precommit hooks including (ruff, safety) see .pre-commit-config.yaml
[group: 'Quality']
pre-commit-run:
  pre-commit run

[group: 'Quality']
test:
  uv run pytest

[group: 'Quality']
test-unit:
  uv run pytest tests/unit_tests

[group: 'Quality']
typecheck:
  uv run pyright

# ----------------------------
# Apple Scripts
# ----------------------------

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

# ----------------------------
# Initial project setup
# You've just cloned the repo, what do you do next?
# ----------------------------

# Initial project setup
[group: 'Workflows']
init:
  just checkout-dev
  just init-env

  # user needs to fill out .env values before continuing
  @echo "Before continuing you must fill out the appropriate values in your .env file"
  @echo "see: https://docs.google.com/spreadsheets/d/1yyOEbXIDyuK4Mr1OmnEuCDZtw7Ym2Hi8AB5QSvuKlHU/edit?gid=0#gid=0"
  just commamd-confirm

  just docker-build
  just create-venv
  just uv-sync
  just migrate

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
  just migrate
  just django-run
  just iterm
  just browsers

