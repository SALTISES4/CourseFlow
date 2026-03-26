from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.deps import get_project_service
from course_flow_v2.api.schemas.projects import ProjectCreateIn, ProjectOut

router = Router(tags=["projects"])


@router.post("", response=ProjectOut)
def create_project(request, payload: ProjectCreateIn):
    svc = get_project_service()
    dto = svc.create(
        owner_id=payload.owner_id,
        title=payload.title,
        description=payload.description,
        is_published=payload.is_published,
        is_template=payload.is_template,
    )
    return ProjectOut(
        id=dto.id,
        uuid=dto.uuid,
        title=dto.title,
        description=dto.description,
        is_published=dto.is_published,
        is_template=dto.is_template,
        owner_id=dto.owner_id,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
    )


@router.get("/{project_uuid}", response=ProjectOut)
def get_project(request, project_uuid: UUID):
    svc = get_project_service()
    dto = svc.get_by_uuid(project_uuid)
    if dto is None:
        raise HttpError(404, "Project not found")
    return ProjectOut(
        id=dto.id,
        uuid=dto.uuid,
        title=dto.title,
        description=dto.description,
        is_published=dto.is_published,
        is_template=dto.is_template,
        owner_id=dto.owner_id,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
    )


@router.get("", response=list[ProjectOut])
def list_projects(request):
    svc = get_project_service()
    rows = svc.list_all()
    return [
        ProjectOut(
            id=r.id,
            uuid=r.uuid,
            title=r.title,
            description=r.description,
            is_published=r.is_published,
            is_template=r.is_template,
            owner_id=r.owner_id,
            date_created=r.date_created,
            modified_on=r.modified_on,
        )
        for r in rows
    ]
