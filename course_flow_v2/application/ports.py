from typing import Any, Protocol
from uuid import UUID

from course_flow_v2.application.dto import (
    ChannelDTO,
    GraphDTO,
    ProjectDTO,
    SectionDTO,
)


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

    def delete(self, uuid: UUID) -> bool: ...


class GraphRepositoryPort(Protocol):
    def create(
        self,
        *,
        owner_id: int,
        project_id: int | None,
        graph_title: str,
        workflow_title: str,
        workflow_type: str,
        workflow_description: str,
    ) -> GraphDTO: ...

    def get_by_uuid(self, uuid: UUID) -> GraphDTO | None: ...

    def list_for_owner(self, owner_id: int) -> list[GraphDTO]: ...

    def list_for_project(self, project_id: int) -> list[GraphDTO]: ...

    def update(self, uuid: UUID, updates: dict[str, Any]) -> GraphDTO | None: ...


class ChannelRepositoryPort(Protocol):
    def create(
        self,
        *,
        graph_uuid: UUID,
        title: str,
        position: int,
        thread_uuid: UUID | None = None,
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
