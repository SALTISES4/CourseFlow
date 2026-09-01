##########################################################
# DJANGO
#########################################################

import 'config.just'
set working-directory := "../.."

[group: 'Django']
migrate:
  uv run python manage.py migrate

[group: 'Django']
make-migrate:
  uv run python manage.py makemigrations

[group: 'Django']
run:
  uv run python manage.py runserver

[group: 'Django']
run-background:
   uv run python manage.py runserver 127.0.0.1:8000 > logs/django.log 2>&1 &

[group: 'Django']
kill-background:
  pkill -f "manage.py runserver" || true

[group: 'Django']
create-superuser:
  DJANGO_SUPERUSER_EMAIL=admin@courseflow.com DJANGO_SUPERUSER_PASSWORD='password' uv run python manage.py createsuperuser --noinput

[group: 'Django']
wait-db:
  bash -lc 'for i in {1..60}; do \
    uv run python manage.py showmigrations --plan >/dev/null 2>&1 \
      && exit 0; \
    sleep 2; \
  done; echo "DB not ready"; exit 1'
