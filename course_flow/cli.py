"""Console script entrypoint (see ``[project.scripts]`` in ``pyproject.toml``)."""

from __future__ import annotations

import os
import sys


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "course_flow_v2.settings")
    import django

    django.setup()
    from django.core.management import call_command

    call_command("cf2_seed_dev_data", *sys.argv[1:])
