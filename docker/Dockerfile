FROM python:3.12-slim-bookworm

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Keep image builds on the same uv release used by CircleCI.
COPY --from=ghcr.io/astral-sh/uv:0.7.0 /uv /uvx /bin/
COPY pyproject.toml uv.lock manage.py README.md ./
COPY course_flow ./course_flow

RUN uv sync --frozen --no-dev

COPY docker/django-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
