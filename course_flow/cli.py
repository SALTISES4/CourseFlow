"""Console script entrypoint (see ``[project.scripts]`` in ``pyproject.toml``)."""

from __future__ import annotations

import os
import sys


def seed_e2e_main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "course_flow.settings")
    import django

    django.setup()
    from django.core.management import call_command

    call_command("cf_seed_e2e_data", *sys.argv[1:])
