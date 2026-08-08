from typing import Any
from uuid import UUID

from course_flow.api.schemas.workflows import WorkflowTypeIn
from course_flow.application.dto import WorkflowDTO
from course_flow.application.ports import WorkflowRepositoryPort
from course_flow.core.hierarchy import (
    InvalidWorkflowTypeError,
    assert_allowed_root_workflow_type,
)
from course_flow.core.models import Channel, Graph, Section, Thread


class WorkflowService:
    def __init__(self, repository: WorkflowRepositoryPort) -> None:
        self._repository = repository

    def create(
        self,
        *,
        author_id: int,
        project_id: int | None,
        title: str,
        workflow_type: WorkflowTypeIn,
        description: str = "",
    ) -> WorkflowDTO:
        clean_title = (title or "").strip()
        if not clean_title:
            raise ValueError("Title is required")
        if len(clean_title) > 200:
            raise ValueError("Title cannot be longer than 200 characters")

        try:
            assert_allowed_root_workflow_type(workflow_type)
        except InvalidWorkflowTypeError as exc:
            raise ValueError(str(exc)) from exc

        workflow_dtd = self._repository.create(
            author_id=author_id,
            project_id=project_id,
            title=clean_title,
            workflow_type=workflow_type.value,
            description=description,
        )

        graph = Graph.objects.filter(uuid=workflow_dtd.graph_uuid).first()

        # create one empty section for the workflow
        Section.objects.create(
            graph_id=graph.id,
            title=""
        )

        # create proper channels depending on the workflow_type
        default_channels = {
            WorkflowTypeIn.ACTIVITY: [
                ["Out of class (instructor)", "#0B118A"],
                ["Out of class (students)", "#114BD4"],
                ["In class (instructor)", "#268AE5"],
                ["In class (students)", "#8BC8FF"],
            ],
            WorkflowTypeIn.COURSE: [
                ["Preparation", "#F7B92A"],
                ["Lesson", "#ED8934"],
                ["Artifact", "#ED4A28"],
                ["Assessment", "#AD1D35"],
            ],
            WorkflowTypeIn.PROGRAM: [
                ["Custom node category", "#468884"],
                ["Custom node category", "#6FA29F"],
                ["Custom node category", "#98BDBB"],
            ],
        }

        for title, colour in default_channels[workflow_type]:
            thread = Thread.objects.create()

            Channel.objects.create(
                graph_id=graph.id,
                title=title,
                colour=colour,
                thread=thread,
            )

        return workflow_dtd

    def get_by_graph_uuid(self, uuid: UUID) -> WorkflowDTO | None:
        """
        lookup the WorkflowDTO by a graph's uuid
        :param uuid:
        :return:
        """
        return self._repository.get_by_graph_uuid(uuid)

    def get_by_workflow_uuid(self, uuid: UUID) -> WorkflowDTO | None:
        return self._repository.get_by_workflow_uuid(uuid)

    def list_for_author(self, author_id: int) -> list[WorkflowDTO]:
        return self._repository.list_for_author(author_id)

    def list_for_project(self, project_id: int) -> list[WorkflowDTO]:
        return self._repository.list_for_project(project_id)

    def list_related(
        self, workflow_uuid: UUID
    ) -> tuple[list[WorkflowDTO], list[WorkflowDTO]]:
        """
        Return workflows contained by, and workflows containing, this workflow.
        """
        return self._repository.list_related(workflow_uuid)

    def update(self, graph_uuid: UUID, updates: dict[str, Any]) -> WorkflowDTO | None:
        return self._repository.update(graph_uuid, updates)

    def update_by_workflow_uuid(
        self, workflow_uuid: UUID, updates: dict[str, Any]
    ) -> WorkflowDTO | None:
        existing = self._repository.get_by_workflow_uuid(workflow_uuid)
        if existing is None:
            return None
        return self._repository.update(existing.graph_uuid, updates)
