from typing import Any
from uuid import UUID

from django.db import transaction

from course_flow.application.dto import WorkflowDTO
from course_flow.application.ports import WorkflowRepositoryPort
from course_flow.core.models import Graph, Workflow


def _to_dto(g: Graph) -> WorkflowDTO:
    workflow = g.workflow
    project = workflow.project if workflow.project_id else None
    return WorkflowDTO(
        id=g.id,
        graph_uuid=g.uuid,
        workflow_uuid=workflow.uuid,
        revision_id=g.revision_id,
        author_id=workflow.author_id,
        project_id=workflow.project_id,
        project_uuid=project.uuid if project is not None else None,
        project_owner_id=project.owner_id if project is not None else None,
        project_is_published=project.is_published if project is not None else False,
        project_is_archived=project.is_archived if project is not None else False,
        is_archived=workflow.is_archived,
        workflow_type=workflow.workflow_type,
        title=workflow.title,
        description=workflow.description,
        date_created=g.date_created,
        modified_on=g.modified_on,
    )


class DjangoWorkflowRepository(WorkflowRepositoryPort):
    @transaction.atomic
    def create(
        self,
        *,
        author_id: int,
        project_id: int | None,
        title: str,
        workflow_type: str,
        description: str,
    ) -> WorkflowDTO:
        g = Graph.objects.create()
        clean_title = (title or "").strip() or "Untitled"
        Workflow.objects.create(
            graph=g,
            author_id=author_id,
            project_id=project_id,
            title=clean_title,
            description=description,
            workflow_type=workflow_type,
        )
        g = Graph.objects.select_related("workflow__project").get(pk=g.pk)
        return _to_dto(g)

    def get_by_graph_uuid(self, uuid: UUID) -> WorkflowDTO | None:
        try:
            g = Graph.objects.select_related("workflow__project").get(uuid=uuid)
        except Graph.DoesNotExist:
            return None
        return _to_dto(g)

    def get_by_workflow_uuid(self, uuid: UUID) -> WorkflowDTO | None:
        try:
            wf = Workflow.objects.select_related("graph", "project").get(uuid=uuid)
        except Workflow.DoesNotExist:
            return None
        return _to_dto(wf.graph)

    def list_for_author(self, author_id: int) -> list[WorkflowDTO]:
        qs = (
            Graph.objects.filter(workflow__author_id=author_id)
            .select_related("workflow__project")
            .order_by("-modified_on")
        )
        return [_to_dto(g) for g in qs]

    def list_for_project(self, project_id: int) -> list[WorkflowDTO]:
        qs = (
            Graph.objects.filter(workflow__project_id=project_id)
            .select_related("workflow__project")
            .order_by("-modified_on")
        )
        return [_to_dto(g) for g in qs]

    def list_related(
        self, workflow_uuid: UUID
    ) -> tuple[list[WorkflowDTO], list[WorkflowDTO]]:
        try:
            workflow = Workflow.objects.only("id").get(uuid=workflow_uuid)
        except Workflow.DoesNotExist:
            return [], []

        contains = (
            Graph.objects.filter(
                workflow__nodes_linked_from__workflow_id=workflow.id,
            )
            .select_related("workflow__project")
            .distinct()
            .order_by("workflow__title", "workflow__uuid")
        )
        appears_in = (
            Graph.objects.filter(
                workflow__nodes__linked_workflow_id=workflow.id,
            )
            .select_related("workflow__project")
            .distinct()
            .order_by("workflow__title", "workflow__uuid")
        )
        return (
            [_to_dto(graph) for graph in contains],
            [_to_dto(graph) for graph in appears_in],
        )

    def update(self, graph_uuid: UUID, updates: dict[str, Any]) -> WorkflowDTO | None:
        try:
            g = Graph.objects.select_related("workflow__project").get(uuid=graph_uuid)
        except Graph.DoesNotExist:
            return None
        wf = g.workflow
        changed = False
        if "title" in updates and updates["title"] is not None:
            wf.title = updates["title"]
            changed = True
        if "project_id" in updates:
            wf.project_id = updates["project_id"]
            changed = True
        if "description" in updates and updates["description"] is not None:
            wf.description = updates["description"]
            changed = True
        if "is_archived" in updates and updates["is_archived"] is not None:
            wf.is_archived = updates["is_archived"]
            changed = True
        if changed:
            wf.save()
        return _to_dto(g)
