#!/bin/sh
set -e

uv run --no-sync python manage.py migrate --noinput
exec uv run --no-sync python manage.py runserver 0.0.0.0:8000
