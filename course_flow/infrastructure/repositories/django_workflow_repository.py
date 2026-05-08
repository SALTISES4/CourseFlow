from typing import Any
from uuid import UUID

from django.db import transaction

from course_flow.application.dto import WorkflowDTO
from course_flow.core.models import Graph, Workflow


def _to_dto(g: Graph) -> WorkflowDTO:
    workflow = g.workflow
    return WorkflowDTO(
        id=g.id,
        graph_uuid=g.uuid,
        workflow_uuid=workflow.uuid,
        revision_id=g.revision_id,
        author_id=workflow.author_id,
        project_id=workflow.project_id,
        workflow_type=workflow.workflow_type,
        title=workflow.title,
        description=workflow.description,
        date_created=g.date_created,
        modified_on=g.modified_on,
    )


class DjangoWorkflowRepository:
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
        g.refresh_from_db()
        return _to_dto(g)

    def get_by_graph_uuid(self, uuid: UUID) -> WorkflowDTO | None:
        try:
            g = Graph.objects.select_related("workflow").get(uuid=uuid)
        except Graph.DoesNotExist:
            return None
        return _to_dto(g)

    def get_by_workflow_uuid(self, uuid: UUID) -> WorkflowDTO | None:
        try:
            wf = Workflow.objects.select_related("graph").get(uuid=uuid)
        except Workflow.DoesNotExist:
            return None
        return _to_dto(wf.graph)

    def list_for_author(self, author_id: int) -> list[WorkflowDTO]:
        qs = (
            Graph.objects.filter(workflow__author_id=author_id)
            .select_related("workflow")
            .order_by("-modified_on")
        )
        return [_to_dto(g) for g in qs]

    def list_for_project(self, project_id: int) -> list[WorkflowDTO]:
        qs = (
            Graph.objects.filter(workflow__project_id=project_id)
            .select_related("workflow")
            .order_by("-modified_on")
        )
        return [_to_dto(g) for g in qs]

    def update(self, graph_uuid: UUID, updates: dict[str, Any]) -> WorkflowDTO | None:
        try:
            g = Graph.objects.select_related("workflow").get(uuid=graph_uuid)
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
        if changed:
            wf.save()
        return _to_dto(g)
