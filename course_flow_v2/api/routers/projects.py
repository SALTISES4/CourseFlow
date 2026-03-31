from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.deps import (
    get_project_detail_service,
    get_project_graph_projection_service,
    get_project_service,
)
from course_flow_v2.api.permissions import can_view_project
from course_flow_v2.api.schemas.graph_projection import (
    ProjectGraphProjectionOut,
)
from course_flow_v2.api.schemas.projects import (
    ProjectCreateIn,
    ProjectDetailOut,
    ProjectDetailOutResp,
    ProjectListItemOut,
    ProjectListMetaOut,
    ProjectListOut,
)

router = Router(tags=["projects"])


@router.post("", response=ProjectDetailOut, auth=BearerAuth())
def create_project(request, payload: ProjectCreateIn):
    current_user = get_current_user(request)
    svc = get_project_service()
    dto = svc.create(
        owner_id=current_user.id,
        title=payload.title,
        description=payload.description,
        is_published=payload.is_published,
        is_template=payload.is_template,
    )
    return ProjectDetailOut(
        uuid=dto.uuid,
        title=dto.title,
        description=dto.description,
        is_published=dto.is_published,
        is_template=dto.is_template,
        owner_id=dto.owner_id,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
    )


@router.get("/{project_uuid}/graph", response=ProjectGraphProjectionOut, auth=BearerAuth())
def get_project_graph(request, project_uuid: UUID):
    current_user = get_current_user(request)
    svc = get_project_service()
    dto = svc.get_by_uuid(project_uuid)

    if dto is None:
        raise HttpError(404, "Project not found")

    if not can_view_project(current_user=current_user, project=dto):
        raise HttpError(403, "Forbidden")

    proj = get_project_graph_projection_service()
    payload = proj.get_by_project_uuid(project_uuid)

    if payload is None:
        raise HttpError(404, "Project not found")
    return payload


@router.get("/{project_uuid}", response=ProjectDetailOutResp, auth=BearerAuth())
def get_project(request, project_uuid: UUID):
    current_user = get_current_user(request)
    svc = get_project_service()
    dto = svc.get_by_uuid(project_uuid)

    if dto is None:
        raise HttpError(404, "Project not found")

    if not can_view_project(current_user=current_user, project=dto):
        raise HttpError(403, "Forbidden")

    detail_payload = get_project_detail_service().get_by_project_uuid(project_uuid)
    if detail_payload is None:
        raise HttpError(404, "Project not found")
    return ProjectDetailOutResp(item=ProjectDetailOut.model_validate(detail_payload))


@router.get("", response=ProjectListOut, auth=BearerAuth())
def list_projects(request):
    current_user = get_current_user(request)
    svc = get_project_service()
    rows = svc.list_for_owner(current_user.id)
    items = [
        ProjectListItemOut(
            uuid=r.uuid,
            title=r.title,
            is_published=r.is_published,
            is_template=r.is_template,
            owner_id=r.owner_id,
            modified_on=r.modified_on,
        )
        for r in rows
    ]
    return ProjectListOut(items=items, meta=ProjectListMetaOut(total=len(items)))
