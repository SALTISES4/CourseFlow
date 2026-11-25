"""Transactional whole-project copy orchestration."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from django.db import transaction

from course_flow.application.project_transfer.contract import (
    ProjectSnapshotBundle,
)
from course_flow.application.project_transfer.service import (
    ProjectImportResult,
    ProjectImportService,
)
from course_flow.application.services.authorization_service import (
    AuthorizationDenied,
    AuthorizationService,
)
from course_flow.core.models import Graph, Project, Tag, User, Workflow
from course_flow.core.permissions import ProjectPermission


class ProjectCopySourceNotFound(LookupError):
    """Raised when the requested source project does not exist."""


class ProjectCopyValidationError(ValueError):
    """Raised when requested copy attributes are invalid."""


class ProjectCopySnapshotExporter(Protocol):
    def export(
        self,
        *,
        project_uuid: UUID,
        source_system: str,
        include_archived_workflows: bool,
        sever_unmapped_links: bool,
    ) -> ProjectSnapshotBundle: ...


class ProjectCopyService:
    """Copy a complete project aggregate into a new private project."""

    def __init__(
        self,
        *,
        authorization: AuthorizationService,
        exporter: ProjectCopySnapshotExporter,
        importer: ProjectImportService,
    ) -> None:
        self._authorization = authorization
        self._exporter = exporter
        self._importer = importer

    @transaction.atomic
    def copy(
        self,
        *,
        source_project_uuid: UUID,
        title: str,
        include_archived_workflows: bool,
        actor: User,
    ) -> ProjectImportResult:
        clean_title = (title or "").strip()
        if not clean_title:
            raise ProjectCopyValidationError("Title is required")
        if len(clean_title) > 200:
            raise ProjectCopyValidationError(
                "Title cannot be longer than 200 characters"
            )
        if not isinstance(include_archived_workflows, bool):
            raise ProjectCopyValidationError(
                "includeArchivedWorkflows must be a boolean"
            )

        try:
            source = Project.objects.get(uuid=source_project_uuid)
        except Project.DoesNotExist as exc:
            raise ProjectCopySourceNotFound from exc

        if source.is_archived:
            raise AuthorizationDenied(ProjectPermission.COPY_PROJECT.value)
        self._require_source_copy_access(actor=actor, source=source)
        self._lock_source_content(source)
        source.refresh_from_db()
        if source.is_archived:
            raise AuthorizationDenied(ProjectPermission.COPY_PROJECT.value)
        self._require_source_copy_access(actor=actor, source=source)

        snapshot = self._exporter.export(
            project_uuid=source.uuid,
            source_system="courseflow-v2-project-copy",
            include_archived_workflows=include_archived_workflows,
            sever_unmapped_links=True,
        )
        copied_workflows = tuple(
            workflow.model_copy(update={"public_link_enabled": False})
            for workflow in snapshot.project.workflows
        )
        copied_project = snapshot.project.model_copy(
            update={
                "title": clean_title,
                "is_published": False,
                "is_archived": False,
                "is_template": False,
                "workflows": copied_workflows,
            }
        )
        copy_snapshot = ProjectSnapshotBundle.build(
            source_system="courseflow-v2-project-copy",
            exported_at=snapshot.source.exported_at,
            exclusions=snapshot.source.exclusions,
            project=copied_project,
        )
        return self._importer.import_project(
            snapshot=copy_snapshot,
            owner_id=actor.id,
            identity_policy="regenerate",
        )

    def _require_source_copy_access(self, *, actor: User, source: Project) -> None:
        try:
            self._authorization.require_project(
                user=actor,
                project=source,
                action=ProjectPermission.COPY_PROJECT,
            )
            return
        except AuthorizationDenied:
            if not (source.is_published and source.is_template):
                raise

        self._authorization.require_project(
            user=actor,
            project=source,
            action=ProjectPermission.VIEW,
        )

    @staticmethod
    def _lock_source_content(source: Project) -> None:
        """
        Stabilize the source aggregate without acquiring a product edit lease.

        Graph rows are locked before the project row to match graph-mutation and
        workflow-copy lock ordering. Re-reading graph rows after the project lock
        includes a workflow that committed immediately before the project lock.
        """
        graph_ids = list(
            Workflow.objects.filter(project_id=source.id)
            .order_by("graph_id")
            .values_list("graph_id", flat=True)
        )
        list(
            Graph.objects.select_for_update()
            .filter(id__in=graph_ids)
            .order_by("id")
            .values_list("id", flat=True)
        )
        Project.objects.select_for_update().get(id=source.id)
        workflow_rows = list(
            Workflow.objects.select_for_update()
            .filter(project_id=source.id)
            .order_by("id")
            .values_list("id", "graph_id")
        )
        list(
            Graph.objects.select_for_update()
            .filter(id__in=[graph_id for _, graph_id in workflow_rows])
            .order_by("id")
            .values_list("id", flat=True)
        )
        list(
            Tag.objects.select_for_update()
            .filter(project_id=source.id)
            .order_by("id")
            .values_list("id", flat=True)
        )
