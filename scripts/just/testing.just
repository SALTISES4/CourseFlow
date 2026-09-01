#########################################################
#  TESTING
#########################################################

import 'config.just'
set working-directory := "../.."

#########################################################
#  TESTING : SETUP
#########################################################

# Deterministic fixtures for local development and Playwright E2E.
[group: 'Testing:setup']
django-seed-e2e-tests:
  uv run cf-seed-e2e-data --clear-and-seed --manifest-path tests/.playwright-fixtures/workflow.json
  uv run cf-check-e2e-assets

[group: 'Testing:setup']
django-clear-e2e-tests:
  uv run cf-seed-e2e-data --clear

[group: 'Testing:setup']
e2e-assets-check:
  uv run cf-check-e2e-assets --check


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


[group: 'Testing:run']
test-frontend:
  cd {{ testing_dir }} && yarn test-ui
