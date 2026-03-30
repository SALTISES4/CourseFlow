from __future__ import annotations

from uuid import UUID

from course_flow_v2.core.models import Project


class ProjectGraphProjectionService:
    """Project-level projection: entity fields + workflow UUID references (no nested graphs)."""

    def get_by_project_uuid(self, project_uuid: UUID):
        p = (
            Project.objects.filter(uuid=project_uuid)
            .prefetch_related("workflows")
            .first()
        )
        if p is None:
            return None

        workflow_uuids = [w.uuid for w in p.workflows.all().order_by("id")]

        return {
            "id": p.id,
            "uuid": p.uuid,
            "title": p.title,
            "description": p.description,
            "is_published": p.is_published,
            "is_template": p.is_template,
            "owner_id": p.owner_id,
            "date_created": p.date_created,
            "modified_on": p.modified_on,
            "workflow_uuids": workflow_uuids,
        }
