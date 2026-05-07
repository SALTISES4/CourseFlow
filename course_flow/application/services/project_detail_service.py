from __future__ import annotations

from uuid import UUID

from course_flow.core.enum import WorkflowType
from course_flow.core.models import Graph, Project


class ProjectDetailService:
    """Assemble project detail with graphs, workflows, and typed workflow meta."""

    def get_by_project_uuid(self, project_uuid: UUID):
        try:
            p = Project.objects.get(uuid=project_uuid)
        except Project.DoesNotExist:
            return None

        graphs = list(
            Graph.objects.filter(workflow__project_id=p.id)
            .select_related("workflow")
            .prefetch_related(
                "workflow__taskmeta",
                "workflow__programmeta",
                "workflow__coursemeta",
                "workflow__activitymeta",
            )
            .order_by("-modified_on", "-id")
        )

        graph_items: list[dict] = []
        for g in graphs:
            workflow = g.workflow
            meta: dict | None = None
            if workflow.workflow_type == WorkflowType.TASK:
                tm = getattr(workflow, "taskmeta", None)
                if tm is not None:
                    meta = {"kind": "task_meta", "context": tm.context}
            elif workflow.workflow_type == WorkflowType.PROGRAM:
                pm = getattr(workflow, "programmeta", None)
                if pm is not None:
                    meta = {
                        "kind": "program_meta",
                        "calculate_time": pm.calculate_time,
                        "calculate_credits": pm.calculate_credits,
                        "calculate_ponderation": pm.calculate_ponderation,
                        "calculate_classification": pm.calculate_classification,
                        "classification_general_time": pm.classification_general_time,
                        "classification_specific_time": pm.classification_specific_time,
                    }
            elif workflow.workflow_type == WorkflowType.COURSE:
                cm = getattr(workflow, "coursemeta", None)
                if cm is not None:
                    meta = {
                        "kind": "course_meta",
                        "classification": cm.classification,
                        "code": cm.code,
                    }
            elif workflow.workflow_type == WorkflowType.ACTIVITY:
                am = getattr(workflow, "activitymeta", None)
                if am is not None:
                    meta = {
                        "kind": "activity_meta",
                        "context": am.context,
                        "classification": am.classification,
                    }

            graph_items.append(
                {
                    "uuid": g.uuid,
                    "revision_id": g.revision_id,
                    "author_id": workflow.author_id,
                    "workflow_project_id": workflow.project_id,
                    "date_created": g.date_created,
                    "modified_on": g.modified_on,
                    "workflow": {
                        "uuid": workflow.uuid,
                        "title": workflow.title,
                        "description": workflow.description,
                        "workflow_type": workflow.workflow_type,
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
            "graphs": graph_items,
        }
