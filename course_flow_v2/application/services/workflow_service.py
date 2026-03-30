from typing import Any
from uuid import UUID

from course_flow_v2.application.dto import WorkflowDTO
from course_flow_v2.application.ports import WorkflowRepositoryPort


class WorkflowService:
    def __init__(self, repository: WorkflowRepositoryPort) -> None:
        self._repository = repository

    def create(
        self,
        *,
        owner_id: int,
        project_id: int | None,
        workflow_title: str,
        unit_title: str,
        unit_type: str,
        unit_description: str = "",
    ) -> WorkflowDTO:
        return self._repository.create(
            owner_id=owner_id,
            project_id=project_id,
            workflow_title=workflow_title,
            unit_title=unit_title,
            unit_type=unit_type,
            unit_description=unit_description,
        )

    def get_by_uuid(self, uuid: UUID) -> WorkflowDTO | None:
        return self._repository.get_by_uuid(uuid)

    def list_for_owner(self, owner_id: int) -> list[WorkflowDTO]:
        return self._repository.list_for_owner(owner_id)

    def list_for_project(self, project_id: int) -> list[WorkflowDTO]:
        return self._repository.list_for_project(project_id)

    def update(self, uuid: UUID, updates: dict[str, Any]) -> WorkflowDTO | None:
        return self._repository.update(uuid, updates)
