FROM python:3.12-slim-bookworm AS base

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Keep image builds on the same uv release used by CircleCI.
COPY --from=ghcr.io/astral-sh/uv:0.7.0 /uv /uvx /bin/
COPY pyproject.toml uv.lock manage.py README.md ./
COPY course_flow ./course_flow
COPY docker/django-entrypoint.sh /entrypoint.sh
COPY docker/django-healthcheck.py /healthcheck.py
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["uv", "run", "--no-sync", "python", "manage.py", "runserver", "0.0.0.0:8000"]

FROM base AS test

ENV UV_PROJECT_ENVIRONMENT=/opt/courseflow-venv

COPY --from=ghcr.io/casey/just:1.58.0 /just /usr/local/bin/just
RUN apt-get update \
    && apt-get install -y --no-install-recommends git libatomic1 \
    && rm -rf /var/lib/apt/lists/* \
    && git config --system --add safe.directory /app \
    && uv sync --frozen --group dev

FROM base AS runtime

RUN uv sync --frozen --no-dev \
    && groupadd --gid 10001 courseflow \
    && useradd --no-create-home --uid 10001 --gid courseflow courseflow

ENV GUNICORN_CMD_ARGS="--bind=0.0.0.0:8000 --workers=2 --timeout=60 --access-logfile=- --error-logfile=- --capture-output" \
    HOME=/tmp \
    UV_CACHE_DIR=/tmp/uv-cache

USER courseflow

CMD ["uv", "run", "--no-sync", "gunicorn", "course_flow.wsgi:application"]
