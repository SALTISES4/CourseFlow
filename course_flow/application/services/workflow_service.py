from typing import Any
from uuid import UUID

from course_flow.application.dto import WorkflowDTO
from course_flow.application.ports import WorkflowRepositoryPort
from course_flow.core.hierarchy import (
    InvalidWorkflowTypeError,
    assert_allowed_root_workflow_type,
)


class WorkflowService:
    def __init__(self, repository: WorkflowRepositoryPort) -> None:
        self._repository = repository

    def create(
        self,
        *,
        author_id: int,
        project_id: int | None,
        title: str,
        workflow_type: str,
        description: str = "",
    ) -> WorkflowDTO:
        try:
            assert_allowed_root_workflow_type(workflow_type)
        except InvalidWorkflowTypeError as exc:
            raise ValueError(str(exc)) from exc

        return self._repository.create(
            author_id=author_id,
            project_id=project_id,
            title=title,
            workflow_type=workflow_type,
            description=description,
        )

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
