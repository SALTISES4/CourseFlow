#########################################################
# TOOLCHAIN
#########################################################

import 'config.just'
set working-directory := "../.."

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
# Help / inspection
#########################################################

[group: 'aux']
export-xml:
    repomix --include "./course_flow,./tests,./react,./docs,./cursor,./circleci"  -o ./assets/repomix.xml --ignore ./assets/

#########################################################
# VCS
#########################################################

[group: 'VCS']
checkout-dev:
  git checkout develop

[group: 'VCS']
pull-dev: checkout-dev
  git pull

#########################################################
# ENVs and template files init
#########################################################

# copy the default root env file template to .env
[group: 'template']
init-env:
  if [ ! -f .env ]; then \
    cp .env.default .env \
  fi


# copy the vite .env file template
[group: 'template']
init-env-frontend:
  cd {{ frontend_dir }} \
  if [ ! -f .env ]; then \
    cp .env.default .env \
  fi

#########################################################
# Frontend
#########################################################

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
# Backend
#########################################################
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


