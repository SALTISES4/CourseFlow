from typing import Any
from uuid import UUID

from course_flow.application.dto import SectionDTO
from course_flow.application.ports import SectionRepositoryPort


class SectionService:
    def __init__(self, repository: SectionRepositoryPort) -> None:
        self._repository = repository

    def create(
        self,
        *,
        graph_uuid: UUID,
        title: str,
        position: int = 0,
        thread_uuid: UUID | None = None,
    ) -> SectionDTO | None:
        return self._repository.create(
            graph_uuid=graph_uuid,
            title=title,
            position=position,
            thread_uuid=thread_uuid,
        )

    def get_by_uuid(self, uuid: UUID) -> SectionDTO | None:
        return self._repository.get_by_uuid(uuid)

    def list_for_graph_uuid(self, graph_uuid: UUID) -> list[SectionDTO]:
        return self._repository.list_for_graph_uuid(graph_uuid)

    def update(self, uuid: UUID, updates: dict[str, Any]) -> SectionDTO | None:
        return self._repository.update(uuid, updates)

    def delete(self, uuid: UUID) -> bool:
        return self._repository.delete(uuid)
