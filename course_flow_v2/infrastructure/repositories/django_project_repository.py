from uuid import UUID

from course_flow_v2.application.dto import ProjectDTO
from course_flow_v2.core.models import Project


def _to_dto(p: Project) -> ProjectDTO:
    return ProjectDTO(
        id=p.id,
        uuid=p.uuid,
        title=p.title,
        description=p.description,
        is_published=p.is_published,
        is_template=p.is_template,
        owner_id=p.owner_id,
        date_created=p.date_created,
        modified_on=p.modified_on,
    )


class DjangoProjectRepository:
    def create(
        self,
        *,
        owner_id: int,
        title: str,
        description: str,
        is_published: bool,
        is_template: bool,
    ) -> ProjectDTO:
        p = Project.objects.create(
            owner_id=owner_id,
            title=title,
            description=description,
            is_published=is_published,
            is_template=is_template,
        )
        return _to_dto(p)

    def get_by_uuid(self, uuid: UUID) -> ProjectDTO | None:
        p = Project.objects.filter(uuid=uuid).first()
        return _to_dto(p) if p else None

    def list_all(self) -> list[ProjectDTO]:
        return [_to_dto(p) for p in Project.objects.select_related("owner").order_by("-modified_on")]
