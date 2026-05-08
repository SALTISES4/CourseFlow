from __future__ import annotations

from uuid import UUID

from course_flow.core.models import Graph, Project


class ProjectGraphViewService:
    """Project-level Graph View: entity fields + graph UUID references."""

    def get_by_project_uuid(self, project_uuid: UUID):
        try:
            p = Project.objects.get(uuid=project_uuid)
        except Project.DoesNotExist:
            return None

        graph_uuids = list(
            Graph.objects.filter(workflow__project_id=p.id)
            .order_by("id")
            .values_list("uuid", flat=True)
        )

        return {
            "uuid": p.uuid,
            "title": p.title,
            "description": p.description,
            "is_published": p.is_published,
            "is_template": p.is_template,
            "owner_id": p.owner_id,
            "date_created": p.date_created,
            "modified_on": p.modified_on,
            "graph_uuids": graph_uuids,
        }
