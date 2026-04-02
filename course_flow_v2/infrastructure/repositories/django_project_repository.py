from typing import Any
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
        try:
            p = Project.objects.get(uuid=uuid)
        except Project.DoesNotExist:
            return None
        return _to_dto(p)

    def get_by_id(self, id: int) -> ProjectDTO | None:
        try:
            p = Project.objects.get(pk=id)
        except Project.DoesNotExist:
            return None
        return _to_dto(p)

    def list_for_owner(self, owner_id: int) -> list[ProjectDTO]:
        return [
            _to_dto(p)
            for p in Project.objects.filter(owner_id=owner_id).order_by("-modified_on")
        ]

    def update(self, uuid: UUID, updates: dict[str, Any]) -> ProjectDTO | None:
        try:
            p = Project.objects.get(uuid=uuid)
        except Project.DoesNotExist:
            return None
        allowed = {"title", "description", "is_published", "is_template"}
        for key, value in updates.items():
            if key in allowed:
                setattr(p, key, value)
        p.save()
        p.refresh_from_db()
        return _to_dto(p)

    def delete(self, uuid: UUID) -> bool:
        deleted, _ = Project.objects.filter(uuid=uuid).delete()
        return deleted > 0
