"""Django settings for CourseFlow V2 (rebuild)."""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
ENVIRONMENT = os.environ.get("ENV", "development").strip().lower()


def env_or_file(name: str, default: str = "") -> str:
    """Read a setting directly or from a Docker/Compose secret file."""
    file_path = os.environ.get(f"{name}_FILE")
    if file_path:
        return Path(file_path).read_text(encoding="utf-8").rstrip("\n")
    return os.environ.get(name, default)


def env_flag(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.lower() in ("1", "true", "yes")


SECRET_KEY = env_or_file("DJANGO_SECRET_KEY", "dev-insecure-change-me")
DEBUG = os.environ.get("DJANGO_DEBUG", "true").lower() in ("1", "true", "yes")
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")

INSTALLED_APPS = [
    "corsheaders",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "course_flow.core.apps.CoreConfig",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "course_flow.urls"
WSGI_APPLICATION = "course_flow.wsgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "cf_core.User"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "courseflow"),
        "USER": os.environ.get("POSTGRES_USER", "courseflow"),
        "PASSWORD": env_or_file("POSTGRES_PASSWORD"),
        "HOST": os.environ.get("POSTGRES_HOST", "127.0.0.1"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        "CONN_MAX_AGE": int(os.environ.get("POSTGRES_CONN_MAX_AGE", "0")),
        "CONN_HEALTH_CHECKS": env_flag("POSTGRES_CONN_HEALTH_CHECKS"),
    }
}

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        # Transactional email templates intentionally live outside the
        # ``course_flow.core`` Django app; make the ADR-defined location
        # explicit instead of relying on APP_DIRS discovery.
        "DIRS": [BASE_DIR / "course_flow" / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

# ---------------------------------------------------------------------------
# CORS — required when the SPA is served from a different origin than the API
# (e.g. Vite on :3000 / :5173, Django on :8000). Use with fetch(..., credentials: "include").
# Wildcard origins are not compatible with credentials; list explicit origins.
# See: https://github.com/adamchainz/django-cors-headers
# ---------------------------------------------------------------------------
_cors_default = (
    "http://localhost:3000,"
    "http://127.0.0.1:3000,"
    "http://localhost:5173,"
    "http://127.0.0.1:5173"
)
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("CORS_ALLOWED_ORIGINS", _cors_default).split(",")
    if o.strip()
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]

if env_flag("DJANGO_TRUST_PROXY_HEADERS"):
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = env_flag("DJANGO_SECURE_SSL_REDIRECT")
SESSION_COOKIE_SECURE = env_flag("DJANGO_SECURE_COOKIES")
CSRF_COOKIE_SECURE = env_flag("DJANGO_SECURE_COOKIES")
SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_SECURE_HSTS_SECONDS", "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_flag("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS")
SECURE_HSTS_PRELOAD = env_flag("DJANGO_SECURE_HSTS_PRELOAD")

AWS_SES_REGION_NAME = os.environ.get("AWS_SES_REGION_NAME", "").strip()
_configured_email_backend = os.environ.get("EMAIL_BACKEND", "").strip()
if _configured_email_backend:
    EMAIL_BACKEND = _configured_email_backend
elif AWS_SES_REGION_NAME:
    EMAIL_BACKEND = "django_ses.SESBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

if AWS_SES_REGION_NAME:
    AWS_SES_REGION_ENDPOINT = (
        os.environ.get("AWS_SES_REGION_ENDPOINT", "").strip()
        or f"email.{AWS_SES_REGION_NAME}.amazonaws.com"
    )
    USE_SES_V2 = True

_default_email_port = "1025" if ENVIRONMENT in {"development", "test"} else "25"
EMAIL_HOST = os.environ.get("EMAIL_HOST", "127.0.0.1").strip()
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", _default_email_port))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = env_or_file("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = env_flag("EMAIL_USE_TLS")
EMAIL_USE_SSL = env_flag("EMAIL_USE_SSL")
EMAIL_TIMEOUT = float(os.environ.get("EMAIL_TIMEOUT", "10"))

DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "webmaster@localhost")
COURSEFLOW_SUPPORT_EMAIL = os.environ.get(
    "COURSEFLOW_SUPPORT_EMAIL", "admin@courseflow.com"
).strip()
COURSEFLOW_FRONTEND_URL = os.environ.get(
    "COURSEFLOW_FRONTEND_URL", "http://localhost:3000"
).strip()
COURSEFLOW_ALLOW_INSECURE_EMAIL_ACTION_URLS = env_flag(
    "COURSEFLOW_ALLOW_INSECURE_EMAIL_ACTION_URLS",
    default=ENVIRONMENT == "development",
)
COURSEFLOW_TRUST_PROXY_CLIENT_IP = env_flag("COURSEFLOW_TRUST_PROXY_CLIENT_IP")
PASSWORD_RESET_TIMEOUT = int(os.environ.get("PASSWORD_RESET_TIMEOUT", "86400"))
PASSWORD_RESET_RATE_LIMIT_SECRET = (
    env_or_file("PASSWORD_RESET_RATE_LIMIT_SECRET").strip() or SECRET_KEY
)
