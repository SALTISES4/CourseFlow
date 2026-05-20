"""Generate or clear deterministic CourseFlow V2 dev seed data."""

from __future__ import annotations

import json

from django.core.management.base import BaseCommand, CommandError

from course_flow.dev_seed.clear import clear_dev_seed_projects
from course_flow.dev_seed.orchestrator import (
    SeedConfig,
    clear_then_seed,
    generate_dev_seed,
)
from course_flow.dev_seed.project_builder import DevSeedAdminMissingError


class Command(BaseCommand):
    help = (
        "Create deterministic DEV SEED projects for local API/graph testing, "
        "or clear seed-owned project trees."
    )

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Remove projects (see --clear-all-projects for scope).",
        )
        parser.add_argument(
            "--clear-all-projects",
            action="store_true",
            help=(
                "With --clear: delete every project. "
                "With --clear-and-seed: wipe all projects before seeding."
            ),
        )
        parser.add_argument(
            "--clear-and-seed",
            action="store_true",
            help="Clear (see --clear-all-projects) then generate seed data.",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=42,
            help="Deterministic seed for structure and Faker (default: 42).",
        )
        parser.add_argument(
            "--graphs-per-project",
            type=int,
            default=3,
            help=(
                "Workflows (graphs) per seeded project (default: 3). "
                "Each project always includes program, course, and activity roots; "
                "values below 3 are raised to 3."
            ),
        )
        parser.add_argument(
            "--section-count",
            type=int,
            default=3,
        )
        parser.add_argument(
            "--channel-count",
            type=int,
            default=3,
        )
        parser.add_argument(
            "--json",
            action="store_true",
            help="Print machine-readable JSON only.",
        )

    def handle(self, *args, **options) -> None:
        clear_flag = options["clear"]
        clear_all = options["clear_all_projects"]
        clear_and_seed = options["clear_and_seed"]

        if clear_all and not (clear_flag or clear_and_seed):
            raise CommandError(
                "--clear-all-projects must be used together with --clear or --clear-and-seed.",
            )

        if clear_flag and not clear_and_seed:
            summary = clear_dev_seed_projects(clear_all_projects=clear_all)
            msg = (
                f"Cleared projects (total objects removed): {summary['total_objects']}"
            )
            if clear_all:
                self.stdout.write(self.style.WARNING(msg))
            else:
                self.stdout.write(msg)
            if options["json"]:
                self.stdout.write(json.dumps(summary, default=str))
            return

        cfg = SeedConfig(
            seed=options["seed"],
            graphs_per_project=options["graphs_per_project"],
            section_count=options["section_count"],
            channel_count=options["channel_count"],
        )

        try:
            if clear_and_seed:
                result = clear_then_seed(cfg, clear_all_projects=clear_all)
            else:
                result = generate_dev_seed(cfg)
        except DevSeedAdminMissingError as exc:
            raise CommandError(str(exc)) from exc

        payload = json.dumps(result, indent=2 if not options["json"] else None)
        self.stdout.write(payload)
