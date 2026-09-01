from typing import Any, Protocol
from uuid import UUID

from course_flow.application.dto import (
    ChannelDTO,
    ProjectDTO,
    SectionDTO,
    WorkflowDTO,
)


class ProjectRepositoryPort(Protocol):
    def create(
        self,
        *,
        owner_id: int,
        title: str,
        description: str | None,
        is_published: bool,
        is_template: bool,
        disciplines: list[str],
    ) -> ProjectDTO: ...

    def get_by_uuid(self, uuid: UUID) -> ProjectDTO | None: ...

    def get_by_id(self, id: int) -> ProjectDTO | None: ...

    def list_for_owner(self, owner_id: int) -> list[ProjectDTO]: ...

    def update(self, uuid: UUID, updates: dict[str, Any]) -> ProjectDTO | None: ...

    def delete(self, uuid: UUID) -> bool: ...


class WorkflowRepositoryPort(Protocol):
    def create(
        self,
        *,
        author_id: int,
        project_id: int | None,
        title: str,
        workflow_type: str,
        description: str,
    ) -> WorkflowDTO: ...

    def get_by_graph_uuid(self, uuid: UUID) -> WorkflowDTO | None: ...

    def get_by_workflow_uuid(self, uuid: UUID) -> WorkflowDTO | None: ...

    def list_for_author(self, author_id: int) -> list[WorkflowDTO]: ...

    def list_for_project(self, project_id: int) -> list[WorkflowDTO]: ...

    def list_related(
        self, workflow_uuid: UUID
    ) -> tuple[list[WorkflowDTO], list[WorkflowDTO]]: ...

    def update(self, graph_uuid: UUID, updates: dict[str, Any]) -> WorkflowDTO | None: ...


class ChannelRepositoryPort(Protocol):
    def create(
        self,
        *,
        graph_uuid: UUID,
        title: str,
        position: int,
        thread_uuid: UUID | None = None,
        colour: str | None = None,
    ) -> ChannelDTO | None: ...

    def get_by_uuid(self, uuid: UUID) -> ChannelDTO | None: ...

    def list_for_graph_uuid(self, graph_uuid: UUID) -> list[ChannelDTO]: ...

    def update(self, uuid: UUID, updates: dict[str, Any]) -> ChannelDTO | None: ...

    def delete(self, uuid: UUID) -> bool: ...


class SectionRepositoryPort(Protocol):
    def create(
        self,
        *,
        graph_uuid: UUID,
        title: str,
        position: int,
        thread_uuid: UUID | None = None,
    ) -> SectionDTO | None: ...

    def get_by_uuid(self, uuid: UUID) -> SectionDTO | None: ...

    def list_for_graph_uuid(self, graph_uuid: UUID) -> list[SectionDTO]: ...

    def update(self, uuid: UUID, updates: dict[str, Any]) -> SectionDTO | None: ...

    def delete(self, uuid: UUID) -> bool: ...
