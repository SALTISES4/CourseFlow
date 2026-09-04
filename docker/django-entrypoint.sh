#!/bin/sh
set -e

if [ "${DJANGO_MIGRATE_ON_STARTUP:-false}" = "true" ]; then
    uv run --no-sync python manage.py migrate --noinput
fi

exec "$@"
