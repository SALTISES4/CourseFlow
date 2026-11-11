"""Export one CourseFlow project to the versioned portable snapshot contract."""

from __future__ import annotations

from pathlib import Path
from uuid import UUID

from django.core.management.base import BaseCommand, CommandError
from pydantic import ValidationError

from course_flow.infrastructure.project_transfer import (
    DjangoProjectSnapshotExporter,
    ProjectSnapshotExportError,
)


class Command(BaseCommand):
    help = "Export one complete project aggregate to a validated JSON snapshot."

    def add_arguments(self, parser) -> None:
        parser.add_argument("project_uuid", type=UUID)
        parser.add_argument("--output", required=True)
        parser.add_argument(
            "--source-system",
            default="courseflow-v2",
            help="Stable identifier for the source environment/system.",
        )
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Replace an existing output file.",
        )

    def handle(self, *args, **options) -> None:
        output = Path(options["output"])
        if output.exists() and not options["overwrite"]:
            raise CommandError(
                f"refusing to overwrite existing snapshot: {output}; pass --overwrite"
            )
        if not output.parent.is_dir():
            raise CommandError(f"output directory does not exist: {output.parent}")

        try:
            snapshot = DjangoProjectSnapshotExporter().export(
                project_uuid=options["project_uuid"],
                source_system=options["source_system"],
            )
        except (ProjectSnapshotExportError, ValidationError) as exc:
            raise CommandError(str(exc)) from exc

        try:
            output.write_text(
                snapshot.model_dump_json(indent=2) + "\n",
                encoding="utf-8",
            )
        except OSError as exc:
            raise CommandError(f"could not write project snapshot: {exc}") from exc
        self.stdout.write(
            self.style.SUCCESS(
                f"Exported {len(snapshot.project.workflows)} workflow(s) to {output}."
            )
        )
