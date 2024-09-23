"""
Django settings for project Course Flow.
name: course_flow

For more information on this file, see:
https://docs.djangoproject.com/en/2.2/topics/settings/

For the full list of settings and their values, see:
https://docs.djangoproject.com/en/2.2/ref/settings/
"""
import logging
import os

from csp.middleware import MiddlewareMixin
from django.http import HttpRequest

from .apps import logger

#########################################################
# PATHS
# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
#########################################################
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_URLCONF = "course_flow.routes.aggregated_urls"

#########################################################
# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.2/howto/deployment/checklist/
#########################################################
SECRET_KEY = "course_flow"
# Needed for production. Avoid using '*'
ALLOWED_HOSTS = ["127.0.0.1", "localhost", "*"]
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False
ADMINS = [("John", "john@example.com"), ("Mary", "mary@example.com")]

#########################################################
# Database
# https://docs.djangoproject.com/en/2.2/ref/settings/#databases
#########################################################
# @todo get rid of sqlite except for testing
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.path.join(BASE_DIR, "db.sqlite3"),
        "TEST": {"NAME": os.path.join(BASE_DIR, "db_test.sqlite3")},
        "OPTIONS": {"timeout": 20},
    }
}
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                # @todo:
                # this needs to be moved...
                # the settings file is not where we should setting app sub-scope
                # we can leave above as these are native django and are to do with handling
                # outer layers (HTTP request auth, debug messages etc)
                "course_flow.context_processors.add_global_context",
            ]
        },
    }
]
#########################################################
# LOGGING
#########################################################

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {
            "format": "%(name)s - %(levelname)s - %(asctime)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        }
    },
    "handlers": {
        "file": {
            "level": "DEBUG",
            "class": "logging.FileHandler",
            "formatter": "simple",
            "filename": os.path.join(BASE_DIR, "logs"),
        },
        "console": {
            "level": "DEBUG" if DEBUG else "INFO",
            "class": "logging.StreamHandler",
            "formatter": "simple",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": True,
        },
        "courseflow": {
            "handlers": ["console", "file"],
            "level": "DEBUG" if DEBUG else "INFO",
        },
    },
}

DEFAULT_FROM_EMAIL = "noreply@courseflow.org"

INSTALLED_APPS = [
    "compressor",
    # "user_feedback.apps.UserFeedbackConfig",
    "course_flow.apps.CourseFlowConfig",
    "rest_framework",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.humanize",
    "daphne",
    "django.contrib.staticfiles",
    "channels",
    "django_extensions",
    "drf_spectacular",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "ratelimit.middleware.RatelimitMiddleware",
    "csp.middleware.CSPMiddleware",
    "djangorestframework_camel_case.middleware.CamelCaseMiddleWare",
    "django.middleware.csrf.CsrfViewMiddleware",
]

# ASGI
ASGI_APPLICATION = "course_flow.asgi.application"
#########################################################
# REDIS / CELERY
#########################################################
# CACHES = {
#     "default": {
#         "BACKEND": "django_redis.cache.RedisCache",
#         "LOCATION": "redis://127.0.0.1:6379/1",
#         "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
#     }
# }

CELERY_BROKER_URL = "redis://localhost:6379"
CELERY_RESULT_BACKEND = "redis://localhost:6379"
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [("127.0.0.1", 6379)]},
    },
}

#########################################################
# CSP POLICIES
#########################################################
CSP_INCLUDE_NONCE_IN = [
    "script-src",
    "style-src",
]

# @todo when CSP_CONNECT_SRC is specific for ws://localhost:3000,other things break
CSP_DEFAULT_SRC = [
    "'self'",
    "*.mydalite.org",
    "ws://localhost:3000",
]
CSP_SCRIPT_SRC = [
    "localhost:3000",
    "'self'",
    "*.mydalite.org",
    "d3js.org",
    "ajax.googleapis.com",
    "cdn.polyfill.io",
    "cdn.quilljs.com",
]

CSP_STYLE_SRC = [
    "'unsafe-inline'",
    "localhost:3000",
    "'self'",
    "*.mydalite.org",
    "ajax.googleapis.com",
    "cdn.quilljs.com",
    "fonts.googleapis.com",
]

CSP_FONT_SRC = [
    "'self'",
    "*.mydalite.org",
    "fonts.gstatic.com",
]

#########################################################
#
#########################################################
LOGIN_URL = "login"
LOGIN_REDIRECT_URL = "course_flow:home"
LOGOUT_REDIRECT_URL = "login"
COURSE_FLOW_PASSWORD_CHANGE_URL = "login"

GRAPH_MODELS = {"all_applications": True, "group_models": True}

#########################################################
# Password validation
# https://docs.djangoproject.com/en/2.2/ref/settings/#auth-password-validators
#########################################################
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttribute"
        "SimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"
    },
]

#########################################################
# Internationalization
# https://docs.djangoproject.com/en/2.2/topics/i18n/
#########################################################
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
DEFAULT_TIMEZONE = "America/Montreal"
USE_I18N = True
USE_L10N = True
USE_TZ = True

#########################################################
# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.2/howto/static-files/
#########################################################
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "server_static/")

STATICFILES_FINDERS = (
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
    "compressor.finders.CompressorFinder",
)

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": (
        "djangorestframework_camel_case.render.CamelCaseJSONRenderer",
        "djangorestframework_camel_case.render.CamelCaseBrowsableAPIRenderer",
        # Any other renders
    ),
    "DEFAULT_PARSER_CLASSES": (
        # If you use MultiPartFormParser or FormParser, we also have a camel case version
        "djangorestframework_camel_case.parser.CamelCaseFormParser",
        "djangorestframework_camel_case.parser.CamelCaseMultiPartParser",
        "djangorestframework_camel_case.parser.CamelCaseJSONParser",
        # Any other parsers
    ),
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication"
    ],
}
SPECTACULAR_SETTINGS = {
    "TITLE": "Courseflow API",
    "DESCRIPTION": "Courseflow description",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    # OTHER SETTINGS
}

COURSE_FLOW_RETURN_URL = {"name": "course_flow:home", "title": "myDalite"}

RATELIMIT_VIEW = "course_flow.views.ratelimited_view"

try:
    from .local_settings import *  # noqa F403

    try:
        INSTALLED_APPS += LOCAL_APPS  # noqa F405
    except NameError as e:
        logger.log(logging.INFO, e)
        pass
except ImportError as e:
    logger.log(logging.INFO, e)
    import warnings

    warnings.warn(
        "File local_settings.py not found. You probably want to add it -- "
        "see README.md."
    )
    pass

#########################################################
# DEBUG TOOLBAR
# Run this AFTER importing local settings, as this is where debug will usually
# be set to true
#########################################################
if DEBUG:
    INSTALLED_APPS += [
        "debug_toolbar",
    ]

    MIDDLEWARE += [
        "debug_toolbar.middleware.DebugToolbarMiddleware",
        "course_flow.middleware.DynamicInternalIPSMiddleware.DynamicInternalIPSMiddleware",
    ]

DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK": "course_flow.settings.show_toolbar",
}
SHOW_TOOLBAR = False

GRAPH_MODELS = {
    "all_applications": True,
    "graph_models": True,
}

#########################################################
# VITE via VENV
#########################################################
# Needed for 'debug' to be available inside templates.
# https://docs.djangoproject.com/en/3.2/ref/templates/api/#django-template-context-processors-debug
INTERNAL_IPS = ["127.0.0.1"]

# Vite App Dir: point it to the folder your vite app is in.
VITE_APP_DIR = os.path.join(BASE_DIR, "react")

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.1/howto/static-files/

# You may change these, but it's important that the dist folder is includedself.
# If it's not, collectstatic won't copy your bundle to production.
STATIC_URL = "/static/"
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "dist"),
]

STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

#########################################################
# CUSTOM APPLICATION
#########################################################
# For LTI tests
PASSWORD_KEY = "course_flow"
COURSE_FLOW_LTI_ACCESS = True
LTI_CLIENT_KEY = "course_flow"  # verify, seems unused
LTI_CLIENT_SECRET = "course_flow"  # verify, seems unused
TEACHER_GROUP = "Teacher"  # verify, seems unused

CHROMEDRIVER_PATH = None


#########################################################
# HELPER FUNCTIONS
#########################################################
def show_toolbar(request: HttpRequest):
    return (
        DEBUG
        and request.META.get("REMOTE_ADDR") in INTERNAL_IPS
        and SHOW_TOOLBAR
    )
