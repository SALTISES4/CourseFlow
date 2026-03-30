from typing import Any, Protocol
from uuid import UUID

from course_flow_v2.application.dto import ProjectDTO, WorkflowDTO


class ProjectRepositoryPort(Protocol):
    def create(
        self,
        *,
        owner_id: int,
        title: str,
        description: str,
        is_published: bool,
        is_template: bool,
    ) -> ProjectDTO: ...

    def get_by_uuid(self, uuid: UUID) -> ProjectDTO | None: ...

    def get_by_id(self, id: int) -> ProjectDTO | None: ...

    def list_for_owner(self, owner_id: int) -> list[ProjectDTO]: ...

    def update(self, uuid: UUID, updates: dict[str, Any]) -> ProjectDTO | None: ...


class WorkflowRepositoryPort(Protocol):
    def create(
        self,
        *,
        owner_id: int,
        project_id: int | None,
        workflow_title: str,
        unit_title: str,
        unit_type: str,
        unit_description: str,
    ) -> WorkflowDTO: ...

    def get_by_uuid(self, uuid: UUID) -> WorkflowDTO | None: ...

    def list_for_owner(self, owner_id: int) -> list[WorkflowDTO]: ...

    def list_for_project(self, project_id: int) -> list[WorkflowDTO]: ...

    def update(self, uuid: UUID, updates: dict[str, Any]) -> WorkflowDTO | None: ...
