from typing import Any
from uuid import UUID

from course_flow.application.dto import (
    ProjectDTO,
    ProjectDuplicatePlaceholderDTO,
)
from course_flow.application.ports import ProjectRepositoryPort


class ProjectService:
    def __init__(self, repository: ProjectRepositoryPort) -> None:
        self._repository = repository

    def create(
        self,
        *,
        owner_id: int,
        title: str,
        description: str | None = None,
        is_published: bool = False,
        is_template: bool = False,
        disciplines: list[int] | None = None,
    ) -> ProjectDTO:
        return self._repository.create(
            owner_id=owner_id,
            title=title,
            description=description,
            is_published=is_published,
            is_template=is_template,
            disciplines=disciplines or [],
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

    DUPLICATE_PLACEHOLDER_MESSAGE = "Project duplication placeholder executed"

    def duplicate_placeholder(
        self,
        *,
        project_uuid: UUID,
        actor_user_id: int,
    ) -> ProjectDuplicatePlaceholderDTO | None:
        """Placeholder for project duplication: verifies the project exists only.

        Does **not** clone the project, graphs, tags, team members, or any related
        data. Full Django-side duplication is intentionally deferred (TODO).

        ``actor_user_id`` is accepted for future authorization/audit when real
        duplication is implemented; it is unused in this placeholder.

        Returns ``None`` if no project exists for ``project_uuid``.
        """
        _ = actor_user_id
        if self.get_by_uuid(project_uuid) is None:
            return None
        return ProjectDuplicatePlaceholderDTO(project_uuid=project_uuid)
