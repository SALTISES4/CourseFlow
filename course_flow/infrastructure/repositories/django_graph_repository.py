from typing import Any
from uuid import UUID

from django.db import transaction

from course_flow.application.dto import GraphDTO
from course_flow.core.models import Graph, Workflow


def _to_dto(w: Graph) -> GraphDTO:
    workflow = w.workflow
    return GraphDTO(
        id=w.id,
        uuid=w.uuid,
        title=w.title,
        owner_id=w.owner_id,
        project_id=w.project_id,
        revision_id=w.revision_id,
        workflow_uuid=workflow.uuid,
        workflow_type=workflow.workflow_type,
        workflow_title=workflow.title,
        date_created=w.date_created,
        modified_on=w.modified_on,
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
        w = Graph.objects.create(
            owner_id=owner_id,
            project_id=project_id,
            title=graph_title,
        )
        Workflow.objects.create(
            graph=w,
            title=workflow_title,
            description=workflow_description,
            workflow_type=workflow_type,
        )
        w.refresh_from_db()
        return _to_dto(w)

    def get_by_uuid(self, uuid: UUID) -> GraphDTO | None:
        try:
            w = Graph.objects.select_related("workflow", "project").get(uuid=uuid)
        except Graph.DoesNotExist:
            return None
        return _to_dto(w)

    def list_for_owner(self, owner_id: int) -> list[GraphDTO]:
        qs = Graph.objects.filter(owner_id=owner_id).select_related(
            "workflow",
            "project",
        ).order_by("-modified_on")
        return [_to_dto(w) for w in qs]

    def list_for_project(self, project_id: int) -> list[GraphDTO]:
        qs = Graph.objects.filter(project_id=project_id).select_related(
            "workflow",
            "project",
        ).order_by("-modified_on")
        return [_to_dto(w) for w in qs]

    def update(self, uuid: UUID, updates: dict[str, Any]) -> GraphDTO | None:
        try:
            w = Graph.objects.get(uuid=uuid)
        except Graph.DoesNotExist:
            return None
        allowed = {"title", "project_id"}
        for key, value in updates.items():
            if key in allowed:
                setattr(w, key, value)
        w.save()
        w = Graph.objects.select_related("workflow", "project").get(pk=w.pk)
        return _to_dto(w)
