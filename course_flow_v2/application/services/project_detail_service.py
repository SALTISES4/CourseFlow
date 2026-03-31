from __future__ import annotations

from uuid import UUID

from course_flow_v2.core.models import Project


class ProjectDetailService:
    """Assemble project detail with workflows, units, and typed unit meta."""

    def get_by_project_uuid(self, project_uuid: UUID):
        try:
            p = Project.objects.get(uuid=project_uuid)
        except Project.DoesNotExist:
            return None

        workflows = list(
            p.workflows.select_related("unit")
            .prefetch_related(
                "unit__task_meta",
                "unit__program_meta",
                "unit__course_meta",
                "unit__activity_meta",
            )
            .order_by("-modified_on", "-id")
        )

        workflow_items: list[dict] = []
        for wf in workflows:
            unit = wf.unit
            meta: dict | None = None
            if unit.unit_type == unit.UnitType.TASK and hasattr(unit, "task_meta"):
                meta = {"kind": "task_meta", "context": unit.task_meta.context}
            elif unit.unit_type == unit.UnitType.PROGRAM and hasattr(
                unit, "program_meta"
            ):
                pm = unit.program_meta
                meta = {
                    "kind": "program_meta",
                    "calculate_time": pm.calculate_time,
                    "calculate_credits": pm.calculate_credits,
                    "calculate_ponderation": pm.calculate_ponderation,
                    "calculate_classification": pm.calculate_classification,
                    "classification_general_time": pm.classification_general_time,
                    "classification_specific_time": pm.classification_specific_time,
                }
            elif unit.unit_type == unit.UnitType.COURSE and hasattr(unit, "course_meta"):
                meta = {
                    "kind": "course_meta",
                    "classification": unit.course_meta.classification,
                    "code": unit.course_meta.code,
                }
            elif unit.unit_type == unit.UnitType.ACTIVITY and hasattr(
                unit, "activity_meta"
            ):
                meta = {
                    "kind": "activity_meta",
                    "context": unit.activity_meta.context,
                    "classification": unit.activity_meta.classification,
                }

            workflow_items.append(
                {
                    "uuid": wf.uuid,
                    "title": wf.title,
                    "owner_id": wf.owner_id,
                    "project_id": wf.project_id,
                    "revision_id": wf.revision_id,
                    "date_created": wf.date_created,
                    "modified_on": wf.modified_on,
                    "unit": {
                        "uuid": unit.uuid,
                        "title": unit.title,
                        "description": unit.description,
                        "unit_type": unit.unit_type,
                        "meta": meta,
                    },
                }
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
            "workflows": workflow_items,
        }
