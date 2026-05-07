from typing import Any
from uuid import UUID

from django.db import transaction

from course_flow.application.dto import GraphDTO
from course_flow.core.models import Graph, Workflow


def _to_dto(g: Graph) -> GraphDTO:
    workflow = g.workflow
    return GraphDTO(
        id=g.id,
        uuid=g.uuid,
        title=workflow.title,
        owner_id=workflow.author_id,
        project_id=workflow.project_id,
        revision_id=g.revision_id,
        workflow_uuid=workflow.uuid,
        workflow_type=workflow.workflow_type,
        workflow_title=workflow.title,
        date_created=g.date_created,
        modified_on=g.modified_on,
    )


class DjangoGraphRepository:
    @transaction.atomic
    def create(
        self,
        *,
        owner_id: int,
        project_id: int | None,
        graph_title: str,
        workflow_title: str,
        workflow_type: str,
        workflow_description: str,
    ) -> GraphDTO:
        g = Graph.objects.create()
        title = (workflow_title or "").strip() or graph_title
        Workflow.objects.create(
            graph=g,
            author_id=owner_id,
            project_id=project_id,
            title=title,
            description=workflow_description,
            workflow_type=workflow_type,
        )
        g.refresh_from_db()
        return _to_dto(g)

    def get_by_uuid(self, uuid: UUID) -> GraphDTO | None:
        try:
            g = Graph.objects.select_related("workflow").get(uuid=uuid)
        except Graph.DoesNotExist:
            return None
        return _to_dto(g)

    def list_for_owner(self, owner_id: int) -> list[GraphDTO]:
        qs = (
            Graph.objects.filter(workflow__author_id=owner_id)
            .select_related("workflow")
            .order_by("-modified_on")
        )
        return [_to_dto(g) for g in qs]

    def list_for_project(self, project_id: int) -> list[GraphDTO]:
        qs = (
            Graph.objects.filter(workflow__project_id=project_id)
            .select_related("workflow")
            .order_by("-modified_on")
        )
        return [_to_dto(g) for g in qs]

    def update(self, uuid: UUID, updates: dict[str, Any]) -> GraphDTO | None:
        try:
            g = Graph.objects.select_related("workflow").get(uuid=uuid)
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
        if changed:
            wf.save()
        return _to_dto(g)
