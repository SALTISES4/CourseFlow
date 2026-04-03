from typing import cast
from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.common.schemas import SuccessOut
from course_flow_v2.api.deps import (
    get_project_detail_service,
    get_project_graph_projection_service,
    get_project_relations_service,
    get_project_service,
)
from course_flow_v2.api.permissions import can_view_project
from course_flow_v2.api.schemas.graph_projection import (
    ProjectGraphProjectionOut,
)
from course_flow_v2.api.schemas.project_subresources import (
    ProjectTeamListMetaOut,
    ProjectTeamListOut,
    ProjectTeamMemberAddIn,
    ProjectTeamMemberOut,
    ProjectTeamMemberRolePatchIn,
    ProjectTeamRoleSchema,
)
from course_flow_v2.api.schemas.projects import (
    ProjectCreateIn,
    ProjectDetailOut,
    ProjectDetailOutResp,
    ProjectDuplicatePlaceholderOut,
    ProjectListItemOut,
    ProjectListMetaOut,
    ProjectListOut,
    ProjectUpdateIn,
)
from course_flow_v2.application.dto import ProjectTeamMemberDTO

router = Router(tags=["projects"], by_alias=True)


def _team_member_out(dto: ProjectTeamMemberDTO) -> ProjectTeamMemberOut:
    return ProjectTeamMemberOut(
        id=dto.id,
        project_team_uuid=dto.project_team_uuid,
        user_uuid=dto.user_uuid,
        user_email=dto.user_email,
        user_first_name=dto.user_first_name,
        user_last_name=dto.user_last_name,
        role=cast(ProjectTeamRoleSchema, dto.role),
    )


@router.post(
    "",
    response=ProjectDetailOut,
    auth=BearerAuth(),
    operation_id="createProject",
)
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


@router.get(
    "/{uuid}/graph",
    response=ProjectGraphProjectionOut,
    auth=BearerAuth(),
    operation_id="getProjectGraph",
)
def get_project_graph(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_project_service()
    dto = svc.get_by_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Project not found")

    if not can_view_project(current_user=current_user, project=dto):
        raise HttpError(403, "Forbidden")

    proj = get_project_graph_projection_service()
    payload = proj.get_by_project_uuid(uuid)

    if payload is None:
        raise HttpError(404, "Project not found")
    return ProjectGraphProjectionOut.model_validate(payload)


@router.post(
    "/{uuid}/duplicate",
    response=ProjectDuplicatePlaceholderOut,
    auth=BearerAuth(),
    operation_id="duplicateProjectPlaceholder",
)
def duplicate_project_placeholder(request, uuid: UUID):
    """Placeholder route: no duplicate project is created (see application service)."""
    current_user = get_current_user(request)
    svc = get_project_service()
    dto = svc.get_by_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Project not found")

    if not can_view_project(current_user=current_user, project=dto):
        raise HttpError(403, "Forbidden")

    result = svc.duplicate_placeholder(
        project_uuid=uuid,
        actor_user_id=current_user.id,
    )
    if result is None:
        raise HttpError(404, "Project not found")

    return ProjectDuplicatePlaceholderOut(
        success=True,
        message=svc.DUPLICATE_PLACEHOLDER_MESSAGE,
        project_uuid=result.project_uuid,
    )


@router.get(
    "/{uuid}/team",
    response=ProjectTeamListOut,
    auth=BearerAuth(),
    operation_id="listProjectTeam",
)
def list_project_team(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_project_service()
    dto = svc.get_by_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Project not found")

    if not can_view_project(current_user=current_user, project=dto):
        raise HttpError(403, "Forbidden")

    rows = get_project_relations_service().list_team_members(uuid)
    if rows is None:
        raise HttpError(404, "Project not found")
    items = [_team_member_out(r) for r in rows]
    return ProjectTeamListOut(
        items=items, meta=ProjectTeamListMetaOut(total=len(items))
    )


@router.post(
    "/{uuid}/team",
    response=ProjectTeamListOut,
    auth=BearerAuth(),
    operation_id="addProjectTeamMembers",
)
def add_project_team_members(request, uuid: UUID, payload: ProjectTeamMemberAddIn):
    current_user = get_current_user(request)
    svc = get_project_service()
    dto = svc.get_by_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Project not found")

    if not can_view_project(current_user=current_user, project=dto):
        raise HttpError(403, "Forbidden")

    rel = get_project_relations_service()
    try:
        rows = rel.add_team_members(uuid, payload.user_uuids, payload.role)
    except ValueError:
        raise HttpError(404, "User not found")
    if rows is None:
        raise HttpError(404, "Project not found")
    items = [_team_member_out(r) for r in rows]
    return ProjectTeamListOut(
        items=items, meta=ProjectTeamListMetaOut(total=len(items))
    )


@router.patch(
    "/{uuid}/team/{membership_id}",
    response=ProjectTeamMemberOut,
    auth=BearerAuth(),
    operation_id="updateProjectTeamMember",
)
def update_project_team_member(
    request, uuid: UUID, membership_id: int, payload: ProjectTeamMemberRolePatchIn
):
    current_user = get_current_user(request)
    svc = get_project_service()
    dto = svc.get_by_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Project not found")

    if not can_view_project(current_user=current_user, project=dto):
        raise HttpError(403, "Forbidden")

    updated = get_project_relations_service().update_team_member_role(
        uuid, membership_id, payload.role
    )
    if updated is None:
        raise HttpError(404, "Team membership not found")
    return _team_member_out(updated)


@router.delete(
    "/{uuid}/team/{membership_id}",
    response=SuccessOut,
    auth=BearerAuth(),
    operation_id="deleteProjectTeamMember",
)
def delete_project_team_member(request, uuid: UUID, membership_id: int):
    current_user = get_current_user(request)
    svc = get_project_service()
    dto = svc.get_by_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Project not found")

    if not can_view_project(current_user=current_user, project=dto):
        raise HttpError(403, "Forbidden")

    ok = get_project_relations_service().remove_team_member(uuid, membership_id)
    if not ok:
        raise HttpError(404, "Team membership not found")
    return SuccessOut()


@router.get(
    "/{uuid}",
    response=ProjectDetailOutResp,
    auth=BearerAuth(),
    operation_id="getProject",
)
def get_project(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_project_service()
    dto = svc.get_by_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Project not found")

    if not can_view_project(current_user=current_user, project=dto):
        raise HttpError(403, "Forbidden")

    detail_payload = get_project_detail_service().get_by_project_uuid(uuid)
    if detail_payload is None:
        raise HttpError(404, "Project not found")
    return ProjectDetailOutResp(item=ProjectDetailOut.model_validate(detail_payload))


@router.patch(
    "/{uuid}",
    response=ProjectDetailOutResp,
    auth=BearerAuth(),
    operation_id="updateProject",
)
def update_project(request, uuid: UUID, payload: ProjectUpdateIn):
    current_user = get_current_user(request)
    svc = get_project_service()
    existing = svc.get_by_uuid(uuid)

    if existing is None:
        raise HttpError(404, "Project not found")

    if not can_view_project(current_user=current_user, project=existing):
        raise HttpError(403, "Forbidden")

    updates = payload.model_dump(exclude_unset=True)
    updated = svc.update(uuid, updates)

    if updated is None:
        raise HttpError(404, "Project not found")

    detail_payload = get_project_detail_service().get_by_project_uuid(uuid)
    if detail_payload is None:
        raise HttpError(404, "Project not found")
    return ProjectDetailOutResp(item=ProjectDetailOut.model_validate(detail_payload))


@router.delete(
    "/{uuid}",
    response=SuccessOut,
    auth=BearerAuth(),
    operation_id="deleteProject",
)
def delete_project(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_project_service()
    existing = svc.get_by_uuid(uuid)

    if existing is None:
        raise HttpError(404, "Project not found")

    if not can_view_project(current_user=current_user, project=existing):
        raise HttpError(403, "Forbidden")

    deleted = svc.delete(uuid)

    if not deleted:
        raise HttpError(404, "Project not found")

    return SuccessOut()


@router.get(
    "",
    response=ProjectListOut,
    auth=BearerAuth(),
    operation_id="listProjects",
)
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
