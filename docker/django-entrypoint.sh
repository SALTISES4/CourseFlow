#!/bin/sh
set -e

if [ "${DJANGO_MIGRATE_ON_STARTUP:-true}" = "true" ]; then
    uv run --no-sync python manage.py migrate --noinput
fi

exec "$@"
