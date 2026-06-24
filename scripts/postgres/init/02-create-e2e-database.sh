#!/bin/bash
# Creates the automated-test database on first Postgres volume initialization.
# Dev data stays in POSTGRES_DB (default: courseflow); E2E uses a sibling database.
set -euo pipefail

e2e_db="${POSTGRES_E2E_DB:-courseflow_e2e}"

psql -v ON_ERROR_STOP=1 \
  --username "${POSTGRES_USER}" \
  --dbname "${POSTGRES_DB}" \
  <<-EOSQL
	SELECT format('CREATE DATABASE %I OWNER %I', '${e2e_db}', '${POSTGRES_USER}')
	WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${e2e_db}')\gexec
	GRANT ALL PRIVILEGES ON DATABASE ${e2e_db} TO ${POSTGRES_USER};
EOSQL
