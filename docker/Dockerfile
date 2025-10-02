FROM ghcr.io/astral-sh/uv:python3.12-bookworm as service_deps
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

########################
# COPY FILES
########################
COPY manage.py pyproject.toml uv.lock ./src/
COPY ./course_flow/ ./src/course_flow
COPY ./docker/docker-entrypoint.sh ./src/
RUN chmod +x /app/src/docker-entrypoint.sh

WORKDIR /app/src
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-mysql-client \
    ca-certificates \
    vim \
 && rm -rf /var/lib/apt/lists/* \

RUN uv venv
RUN uv sync


ENTRYPOINT ["/app/src/docker-entrypoint.sh"]

EXPOSE 8000
