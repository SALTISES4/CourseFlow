from typing import Any
from uuid import UUID

from course_flow_v2.application.dto import ProjectDTO
from course_flow_v2.application.ports import ProjectRepositoryPort


class ProjectService:
    def __init__(self, repository: ProjectRepositoryPort) -> None:
        self._repository = repository

    def create(
        self,
        *,
        owner_id: int,
        title: str,
        description: str = "",
        is_published: bool = False,
        is_template: bool = False,
    ) -> ProjectDTO:
        return self._repository.create(
            owner_id=owner_id,
            title=title,
            description=description,
            is_published=is_published,
            is_template=is_template,
        )

    def get_by_uuid(self, uuid: UUID) -> ProjectDTO | None:
        return self._repository.get_by_uuid(uuid)

    def get_by_id(self, id: int) -> ProjectDTO | None:
        return self._repository.get_by_id(id)

    def list_for_owner(self, owner_id: int) -> list[ProjectDTO]:
        return self._repository.list_for_owner(owner_id)

    def update(self, uuid: UUID, updates: dict[str, Any]) -> ProjectDTO | None:
        return self._repository.update(uuid, updates)

    def delete(self, uuid: UUID) -> bool:
        return self._repository.delete(uuid)
