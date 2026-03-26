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

    def list_all(self) -> list[ProjectDTO]:
        return self._repository.list_all()
