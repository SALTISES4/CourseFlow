```md
# Local Development Runbook

## Status

Starter draft based on the current CourseFlow repository snapshot.
Exact commands and scripts should be finalized once the canonical dev workflow stabilizes.

---

# Goal

Provide one location where both humans and coding agents can quickly answer:

- how to boot the backend and frontend
- how configuration is loaded
- which services must be running
- which entrypoints correspond to which runtime modes
- what prerequisites must exist before the system will function

The goal is to eliminate guesswork during local development.

---

# Preconditions

A working local CourseFlow development environment requires the following components.

## Core dependencies

At minimum:

- Python environment for the backend
- Node.js environment for the React frontend
- PostgreSQL database
- environment variables or `.env` configuration
- websocket support through the Django backend runtime

---

## Optional but common development dependencies

Depending on the features being tested:

- Redis (if used for websocket channels or caching)
- local email or notification configuration
- test data fixtures

---

# System components

Local development typically runs **three processes**:

| Component | Purpose |
|---|---|
| Django backend | API, persistence, websocket server |
| React frontend | UI and editing environment |
| PostgreSQL | workflow persistence |

If websockets use Channels + Redis, then Redis must also run locally.

---

# Configuration model

Configuration is loaded from multiple sources.

Typical precedence:

1. environment variables
2. `.env` file
3. Django settings modules
4. frontend environment configuration

Backend configuration ultimately resolves through the Django settings layer.

Frontend configuration is typically injected via environment variables during the React build or dev server startup.

---

# Backend entrypoints

The Django backend exposes several runtime entrypoints.

## Development server

Primary development server:

```

python manage.py runserver

```

Responsibilities:

- REST API
- websocket endpoints
- permission enforcement
- workflow mutation handling

If Django Channels is used, this command may instead launch an ASGI server.

---

## Database migrations

When schema changes occur:

```

python manage.py migrate

```

For creating migrations:

```

python manage.py makemigrations

```

---

## Django shell

Useful for debugging models and services:

```

python manage.py shell

```

---

# Frontend entrypoint

The React frontend runs independently from the backend.

Typical development startup:

```

npm install
npm run start

```

or

```

yarn install
yarn start

```

Responsibilities:

- workflow editing UI
- websocket client connections
- REST API interaction
- local editing state

The development server typically runs on a port such as:

```

[http://localhost:3000](http://localhost:3000)

```

---

# Websocket endpoints

Realtime collaboration relies on websocket connections.

Typical route pattern:

```

ws/update/<workflowPk>/

```

Backend components involved include:

- websocket routing configuration
- websocket consumers
- workflow event dispatch logic

Clients must be authenticated and authorized before a websocket connection is accepted.

---

# Database initialization

Local development requires a working PostgreSQL database.

Typical tasks:

1. create local database
2. configure database connection in Django settings
3. run migrations

Example workflow:

```

createdb courseflow_dev
python manage.py migrate

```

---

# First-pass startup checklist

Typical local development startup sequence:

1. Start PostgreSQL locally.
2. Configure environment variables or `.env`.
3. Run backend migrations.
4. Start the Django backend server.
5. Install frontend dependencies.
6. Start the React development server.
7. Open the frontend in the browser.

---

# Verifying the environment

Basic sanity checks:

### Backend

Confirm API responds:

```

[http://localhost:8000/](http://localhost:8000/)

```

Confirm websocket endpoint accepts connections.

### Frontend

Confirm the UI loads and can fetch workflows.

### Database

Confirm workflows can be created, edited, and saved.

---

# Common failure points

Typical local development issues include:

### Migration drift

Symptoms:

- models do not match database schema

Fix:

```

python manage.py makemigrations
python manage.py migrate

```

---

### Websocket connection failures

Symptoms:

- collaboration not updating across clients

Possible causes:

- websocket routing misconfigured
- missing Redis dependency (if Channels backend used)
- authentication failure during websocket connect

---

### CORS or API base URL misconfiguration

Symptoms:

- frontend cannot reach backend API

Fix:

- verify frontend environment variables
- verify Django CORS settings

---

# Required follow-up

This runbook should eventually include:

- exact backend startup commands
- canonical `.env` template
- Redis requirements (if used)
- docker-compose development workflow (if introduced)
- automated dev bootstrap scripts

Once the development workflow stabilizes, this document should become the **single authoritative source for local development setup**.
```
