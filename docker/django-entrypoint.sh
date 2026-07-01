#!/bin/sh
set -e

uv run python manage.py migrate --noinput
exec uv run python manage.py runserver 0.0.0.0:8000
