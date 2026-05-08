from __future__ import annotations

from uuid import UUID

from course_flow_v2.api.schemas.projects import (
    ActivityMetaOut,
    CourseMetaOut,
    ProgramMetaOut,
    ProjectDetailOut,
    ProjectGraphOut,
    TaskMetaOut,
    WorkflowOut,
)
from course_flow_v2.core.models import (
    FavoriteProject,
    Project,
)


class ProjectDetailService:
    """Assemble project detail with graphs, workflows, and typed workflow meta."""

    def get_by_project_uuid(self, project_uuid: UUID):
        try:
            p = Project.objects.get(uuid=project_uuid)
        except Project.DoesNotExist:
            return None

        graphs = list(
            p.graphs.select_related("workflow")
            .prefetch_related(
                "workflow__task_meta",
                "workflow__program_meta",
                "workflow__course_meta",
                "workflow__activity_meta",
            )
            .order_by("-modified_on", "-id")
        )

        graph_items: list["ProjectGraphOut"] = []
        for wf in graphs:
            workflow = wf.workflow
            meta: TaskMetaOut | ProgramMetaOut | CourseMetaOut | ActivityMetaOut | None = None
            if workflow.workflow_type == workflow.WorkflowType.TASK and hasattr(workflow, "task_meta"):
                meta = TaskMetaOut(
                    kind="task_meta",
                    context=workflow.task_meta.context
                )
            elif workflow.workflow_type == workflow.WorkflowType.PROGRAM and hasattr(
                workflow, "program_meta"
            ):
                pm = workflow.program_meta
                meta = ProgramMetaOut(
                    kind="program_meta",
                    calculate_time=pm.calculate_time,
                    calculate_credits=pm.calculate_credits,
                    calculate_ponderation=pm.calculate_ponderation,
                    calculate_classification=pm.calculate_classification,
                    classification_general_time=pm.classification_general_time,
                    classification_specific_time=pm.classification_specific_time,
                )
            elif workflow.workflow_type == workflow.WorkflowType.COURSE and hasattr(workflow, "course_meta"):
                meta = CourseMetaOut(
                    kind="course_meta",
                    classification=workflow.course_meta.classification,
                    code=workflow.course_meta.code,
                )
            elif workflow.workflow_type == workflow.WorkflowType.ACTIVITY and hasattr(
                workflow, "activity_meta"
            ):
                meta = ActivityMetaOut(
                    kind="activity_meta",
                    context=workflow.activity_meta.context,
                    classification=workflow.activity_meta.classification,
                )

            graph_items.append(
                ProjectGraphOut(
                    uuid=wf.uuid,
                    title=wf.title,
                    owner_id=wf.owner_id,
                    project_id=wf.project_id,
                    revision_id=wf.revision_id,
                    date_created=wf.date_created,
                    modified_on=wf.modified_on,
                    workflow=WorkflowOut(
                        uuid=workflow.uuid,
                        title=workflow.title,
                        description=workflow.description,
                        workflow_type=workflow.workflow_type,
                        meta=meta,
                    ),
                )
            )


        is_favourite = FavoriteProject.objects.filter(project_id=p.id).exists()

        return ProjectDetailOut(
            uuid=p.uuid,
            title=p.title,
            description=p.description,
            is_published=p.is_published,
            is_template=p.is_template,
            is_favourite=is_favourite,
            date_created=p.date_created,
            modified_on=p.modified_on,
            owner_id=p.owner_id,
            graphs=graph_items,
        )
