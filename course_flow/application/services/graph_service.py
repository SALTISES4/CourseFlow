from typing import Any
from uuid import UUID

from course_flow.application.dto import GraphDTO
from course_flow.application.ports import GraphRepositoryPort


class GraphService:
    def __init__(self, repository: GraphRepositoryPort) -> None:
        self._repository = repository

    def create(
        self,
        *,
        author_id: int,
        workflow_project_id: int | None,
        workflow_title: str,
        workflow_type: str,
        workflow_description: str = "",
    ) -> GraphDTO:
        return self._repository.create(
            author_id=author_id,
            workflow_project_id=workflow_project_id,
            workflow_title=workflow_title,
            workflow_type=workflow_type,
            workflow_description=workflow_description,
        )

    def get_by_uuid(self, uuid: UUID) -> GraphDTO | None:
        return self._repository.get_by_uuid(uuid)

    def list_for_author(self, author_id: int) -> list[GraphDTO]:
        return self._repository.list_for_author(author_id)

    def list_for_project(self, project_id: int) -> list[GraphDTO]:
        return self._repository.list_for_project(project_id)

    def update(self, uuid: UUID, updates: dict[str, Any]) -> GraphDTO | None:
        return self._repository.update(uuid, updates)
