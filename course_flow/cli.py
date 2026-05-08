"""Console script entrypoint (see ``[project.scripts]`` in ``pyproject.toml``)."""

from __future__ import annotations

import os
import sys


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "course_flow.settings")
    import django

    django.setup()
    from django.core.management import call_command

    # magic django pathing
    # course_flow/core/management/commands/cf_seed_dev_data.py
    call_command("cf_seed_dev_data", *sys.argv[1:])


def seed_notifications_main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "course_flow.settings")
    import django

    django.setup()
    from django.core.management import call_command

    call_command("cf_seed_dev_notifications", *sys.argv[1:])
