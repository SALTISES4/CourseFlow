import os
from functools import wraps

import celery
from celery.exceptions import OperationalError
from celery.utils.log import get_logger

logger = get_logger("peerinst-scheduled")

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "course_flow.settings")

app = celery.Celery("course_flow")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django apps.
app.autodiscover_tasks()


@app.task
def heartbeat():
    logger.info("Heartbeat check")
    pass


def try_async(func):
    """
    From https://github.com/SALTISES4/dalite-ng/blob/master/dalite/celery.py
    Decorator for celery tasks such that they default to synchronous operation
    if the broker is unavailable or inspect cannot see workers (i.e. we don't always see the worker for some reason) 
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            celery.current_app.control.ping()
        except OperationalError as e:
            info = "Celery unavailable ({}).  Executing {} synchronously.".format(  # noqa
                e, func.__name__
            )
            logger.info(info)
            return func(*args, **kwargs)

        logger.info("Checking for available workers...")
        try:
            available_workers = celery.current_app.control.inspect().active()
        except Exception as e:
            logger.warning(
                "Celery inspect failed ({}). Executing {} synchronously.".format(
                    e, func.__name__
                )
            )
            return func(*args, **kwargs)

        if available_workers:
            info = "Celery workers available ({}).  Executing {} asynchronously.".format(  # noqa
                list(available_workers.keys()), func.__name__
            )
            logger.info(info)
            return func.delay(*args, **kwargs)

        info = "No celery workers available.  Executing {} synchronously.".format(  # noqa
            func.__name__
        )
        logger.info(info)
        return func(*args, **kwargs)

    return wrapper
