from __future__ import annotations

from uuid import UUID

from course_flow.core.models import Project


class ProjectGraphProjectionService:
    """Project-level projection: entity fields + graph UUID references (no nested graphs)."""

    def get_by_project_uuid(self, project_uuid: UUID):
        try:
            p = Project.objects.prefetch_related("graphs").get(uuid=project_uuid)
        except Project.DoesNotExist:
            return None

        graph_uuids = [w.uuid for w in p.graphs.all().order_by("id")]

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
