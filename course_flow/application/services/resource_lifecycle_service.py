"""Transactional project and workflow archive lifecycle operations."""

from __future__ import annotations

from uuid import UUID

from django.db import transaction
from django.db.models import F
from django.utils import timezone

from course_flow.application.services.authorization_service import (
    AuthorizationService,
)
from course_flow.core.models import (
    FavoriteGraph,
    FavoriteProject,
    Graph,
    Node,
    Project,
    User,
    Workflow,
)
from course_flow.core.permissions import ProjectPermission, WorkflowPermission


class ResourceStateConflict(ValueError):
    """The requested lifecycle transition conflicts with parent resource state."""


class ResourceLifecycleService:
    def __init__(self) -> None:
        self._authorization = AuthorizationService()

    @transaction.atomic
    def archive_project(self, *, project_uuid: UUID, user: User) -> bool:
        try:
            project = Project.objects.select_for_update().get(uuid=project_uuid)
        except Project.DoesNotExist:
            return False

        self._authorization.require_project(
            user=user,
            project=project,
            action=ProjectPermission.ARCHIVE_PROJECT,
        )
        workflows = Workflow.objects.filter(project_id=project.id)
        graph_ids = list(workflows.values_list("graph_id", flat=True))

        project.is_archived = True
        project.is_published = False
        project.save(update_fields=["is_archived", "is_published", "modified_on"])
        workflows.update(is_archived=True, modified_on=timezone.now())
        FavoriteProject.objects.filter(project_id=project.id).delete()
        FavoriteGraph.objects.filter(graph_id__in=graph_ids).delete()
        return True

    @transaction.atomic
    def restore_project(self, *, project_uuid: UUID, user: User) -> bool:
        try:
            project = Project.objects.select_for_update().get(uuid=project_uuid)
        except Project.DoesNotExist:
            return False

        self._authorization.require_project(
            user=user,
            project=project,
            action=ProjectPermission.RESTORE_PROJECT,
        )
        project.is_archived = False
        project.save(update_fields=["is_archived", "modified_on"])
        Workflow.objects.filter(project_id=project.id).update(
            is_archived=False,
            modified_on=timezone.now(),
        )
        return True

    @transaction.atomic
    def archive_workflow(self, *, workflow_uuid: UUID, user: User) -> bool:
        try:
            workflow = (
                Workflow.objects.select_for_update(of=("self",))
                .select_related("graph", "project")
                .get(uuid=workflow_uuid)
            )
        except Workflow.DoesNotExist:
            return False

        self._authorization.require_workflow(
            user=user,
            workflow=workflow,
            action=WorkflowPermission.ARCHIVE,
        )
        linked_nodes = Node.objects.filter(linked_workflow_id=workflow.id)
        parent_graph_ids = set(
            linked_nodes.exclude(section_id=None).values_list(
                "section__graph_id",
                flat=True,
            )
        )
        parent_graph_ids.update(
            linked_nodes.exclude(channel_id=None).values_list(
                "channel__graph_id",
                flat=True,
            )
        )
        workflow.is_archived = True
        workflow.save(update_fields=["is_archived", "modified_on"])
        FavoriteGraph.objects.filter(graph_id=workflow.graph_id).delete()
        linked_nodes.update(linked_workflow_id=None)
        Graph.objects.filter(id__in=parent_graph_ids).update(
            revision_id=F("revision_id") + 1,
            modified_on=timezone.now(),
        )
        return True

    @transaction.atomic
    def restore_workflow(self, *, workflow_uuid: UUID, user: User) -> bool:
        try:
            workflow = (
                Workflow.objects.select_for_update(of=("self",))
                .select_related("graph", "project")
                .get(uuid=workflow_uuid)
            )
        except Workflow.DoesNotExist:
            return False

        self._authorization.require_workflow(
            user=user,
            workflow=workflow,
            action=WorkflowPermission.RESTORE,
        )
        if workflow.project is not None and workflow.project.is_archived:
            raise ResourceStateConflict("Restore the parent project first")

        workflow.is_archived = False
        workflow.save(update_fields=["is_archived", "modified_on"])
        return True

    @transaction.atomic
    def delete_workflow_permanently(
        self,
        *,
        workflow_uuid: UUID,
        user: User,
    ) -> bool:
        try:
            workflow = (
                Workflow.objects.select_for_update(of=("self",))
                .select_related("graph", "project")
                .get(uuid=workflow_uuid)
            )
        except Workflow.DoesNotExist:
            return False

        self._authorization.require_workflow(
            user=user,
            workflow=workflow,
            action=WorkflowPermission.DELETE_PERMANENTLY,
        )
        workflow.delete()
        return True
