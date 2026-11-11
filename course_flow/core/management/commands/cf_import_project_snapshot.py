"""Create a project aggregate from a validated portable snapshot."""

from __future__ import annotations

from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from pydantic import ValidationError

from course_flow.application.project_transfer.contract import (
    ProjectSnapshotBundle,
)
from course_flow.application.project_transfer.service import (
    ProjectImportService,
)
from course_flow.core.models import User
from course_flow.infrastructure.project_transfer import (
    DjangoProjectSnapshotWriter,
    ProjectSnapshotImportError,
)


class Command(BaseCommand):
    help = "Validate a project snapshot and create its complete aggregate atomically."

    def add_arguments(self, parser) -> None:
        parser.add_argument("snapshot_path")
        parser.add_argument(
            "--owner-email",
            required=True,
            help="Existing destination user who will own and author imported content.",
        )
        parser.add_argument(
            "--regenerate-identities",
            action="store_true",
            help=(
                "Generate new destination UUIDs. The default preserves UUID references "
                "and refuses collisions, which is appropriate for environment rebuilds."
            ),
        )

    def handle(self, *args, **options) -> None:
        snapshot_path = Path(options["snapshot_path"])
        if not snapshot_path.is_file():
            raise CommandError(f"snapshot file does not exist: {snapshot_path}")
        try:
            snapshot = ProjectSnapshotBundle.model_validate_json(
                snapshot_path.read_text(encoding="utf-8")
            )
        except (OSError, ValidationError) as exc:
            raise CommandError(f"invalid project snapshot: {exc}") from exc

        owner_email = options["owner_email"].strip()
        try:
            owner = User.objects.get(email=owner_email)
        except User.DoesNotExist as exc:
            raise CommandError(f"destination owner does not exist: {owner_email}") from exc

        identity_policy = (
            "regenerate" if options["regenerate_identities"] else "preserve"
        )
        try:
            result = ProjectImportService(DjangoProjectSnapshotWriter()).import_project(
                snapshot=snapshot,
                owner_id=owner.id,
                identity_policy=identity_policy,
            )
        except ProjectSnapshotImportError as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(
            self.style.SUCCESS(
                "Imported project "
                f"{result.project_uuid} with {result.workflow_count} workflow(s), "
                f"{result.node_count} node(s), and {result.outcome_count} outcome(s)."
            )
        )
