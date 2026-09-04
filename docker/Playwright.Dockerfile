FROM ghcr.io/casey/just:1.58.0 AS just

FROM mcr.microsoft.com/playwright:v1.61.0-noble

COPY --from=just /just /usr/local/bin/just

RUN corepack enable \
    && corepack prepare yarn@1.22.22 --activate

WORKDIR /app
