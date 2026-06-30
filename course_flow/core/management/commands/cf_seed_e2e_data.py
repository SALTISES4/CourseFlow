"""Generate or clear deterministic Playwright E2E fixture data."""

from __future__ import annotations

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from course_flow.dev_seed.project_builder import DevSeedAdminMissingError
from course_flow.e2e_seed.clear import clear_e2e_fixtures
from course_flow.e2e_seed.orchestrator import (
    clear_then_seed_e2e_fixtures,
    generate_e2e_fixtures,
)


class Command(BaseCommand):
    help = (
        "Create deterministic E2E FIXTURE projects for Playwright browser tests, "
        "or clear fixture-owned project trees."
    )

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Remove projects whose titles start with the E2E fixture prefix.",
        )
        parser.add_argument(
            "--clear-and-seed",
            action="store_true",
            help="Clear E2E fixtures, then generate the canonical fixture project.",
        )
        parser.add_argument(
            "--json",
            action="store_true",
            help="Print machine-readable JSON only.",
        )
        parser.add_argument(
            "--manifest-path",
            type=str,
            default="",
            help=(
                "Write the fixture manifest JSON to this path "
                "(e.g. tests/.playwright-fixtures/workflow.json)."
            ),
        )

    def handle(self, *args, **options) -> None:
        clear_flag = options["clear"]
        clear_and_seed = options["clear_and_seed"]
        manifest_raw = (options["manifest_path"] or "").strip()
        manifest_path = Path(manifest_raw) if manifest_raw else None

        if clear_flag and not clear_and_seed:
            summary = clear_e2e_fixtures()
            msg = f"Cleared E2E fixtures (total objects removed): {summary['total_objects']}"
            self.stdout.write(msg)
            if options["json"]:
                self.stdout.write(json.dumps(summary, default=str))
            return

        try:
            if clear_and_seed:
                result = clear_then_seed_e2e_fixtures(manifest_path=manifest_path)
            else:
                result = generate_e2e_fixtures(manifest_path=manifest_path)
        except DevSeedAdminMissingError as exc:
            raise CommandError(str(exc)) from exc

        payload = json.dumps(result, indent=2 if not options["json"] else None)
        self.stdout.write(payload)
