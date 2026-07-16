from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.common.schemas import SuccessOut
from course_flow.api.deps import (
    get_authorization_service,
    get_project_graph_view_service,
    get_project_relations_service,
    get_project_service,
    get_resource_lifecycle_service,
    get_workflow_service,
)
from course_flow.api.permission_context import permission_context_out
from course_flow.api.schemas.project_graph_view import ProjectGraphViewOut
from course_flow.api.schemas.project_subresources import (
    DisciplineListItemOut,
    ProjectTeamListMetaOut,
    ProjectTeamListOut,
    ProjectTeamMemberAddIn,
    ProjectTeamMemberOut,
    ProjectTeamMemberRolePatchIn,
    ProjectTeamRoleSchema,
)
from course_flow.api.schemas.projects import (
    DisciplineOption,
    ProjectCreateIn,
    ProjectDetailOut,
    ProjectDetailOutResp,
    ProjectDuplicatePlaceholderOut,
    ProjectListItemOut,
    ProjectListMetaOut,
    ProjectListOut,
    ProjectUpdateIn,
    ProjectWorkflowListItemOut,
)
from course_flow.application.dto import ProjectDTO, ProjectTeamMemberDTO
from course_flow.application.services.authorization_service import (
    AuthorizationDenied,
)
from course_flow.core.enum import WorkflowType
from course_flow.core.models import (
    Discipline,
    FavoriteGraph,
    FavoriteProject,
    Graph,
    User,
)
from course_flow.core.permissions import (
    ProjectPermission,
    ResourceRole,
    WorkflowPermission,
)

router = Router(tags=["projects"], by_alias=True)


def _team_member_out(dto: ProjectTeamMemberDTO) -> ProjectTeamMemberOut:
    return ProjectTeamMemberOut(
        id=dto.id,
        project_team_uuid=dto.project_team_uuid,
        user_uuid=dto.user_uuid,
        user_email=dto.user_email,
        user_first_name=dto.user_first_name,
        user_last_name=dto.user_last_name,
        role=ProjectTeamRoleSchema(dto.role),
    )


def _project_permissions(current_user: User, dto: ProjectDTO):
    return get_authorization_service().permissions_for_project(
        user=current_user,
        project=dto,
    )


def _require_project_permission(
    current_user: User,
    dto: ProjectDTO,
    action: ProjectPermission,
) -> None:
    try:
        get_authorization_service().require_project(
            user=current_user,
            project=dto,
            action=action,
        )
    except AuthorizationDenied as exc:
        raise HttpError(403, "Forbidden") from exc


def _project_detail_out(current_user: User, dto: ProjectDTO) -> ProjectDetailOut:
    current_user_id = current_user.id
    workflow_rows = get_workflow_service().list_for_project(dto.id)
    workflow_uuids = [row.graph_uuid for row in workflow_rows]
    if not workflow_uuids:
        favorite_graph_uuids: set[UUID] = set()
    else:
        graph_uuid_to_id = dict(
            Graph.objects.filter(uuid__in=workflow_uuids).values_list("uuid", "id")
        )
        graph_ids = list(graph_uuid_to_id.values())
        favorite_graph_ids = set(
            FavoriteGraph.objects.filter(
                user_id=current_user_id,
                graph_id__in=graph_ids,
            ).values_list("graph_id", flat=True)
        )
        id_to_graph_uuid = {gid: gu for gu, gid in graph_uuid_to_id.items()}
        favorite_graph_uuids = {
            id_to_graph_uuid[gid] for gid in favorite_graph_ids if gid in id_to_graph_uuid
        }
    workflows: list[ProjectWorkflowListItemOut] = []
    for row in workflow_rows:
        workflow_permissions = get_authorization_service().permissions_for_workflow(
            user=current_user,
            workflow=row,
        )
        if (
            not workflow_permissions.allows(WorkflowPermission.VIEW)
            and workflow_permissions.resource_role is ResourceRole.PUBLIC
        ):
            continue
        workflows.append(
            ProjectWorkflowListItemOut(
                uuid=row.workflow_uuid,
                title=row.title,
                description=row.description,
                workflow_type=WorkflowType(row.workflow_type),
                is_archived=row.is_archived,
                is_favorite=row.graph_uuid in favorite_graph_uuids,
                permissions=permission_context_out(workflow_permissions),
            )
        )

    is_favorite = FavoriteProject.objects.filter(
        user_id=current_user_id,
        project_id=dto.id,
    ).exists()
    disciplines = get_project_relations_service().list_disciplines(dto.uuid) or []

    # TODO: properly handle archived flag
    is_archived = False

    disciplines = [
        DisciplineOption(id=d.id, title=d.label)
        for d in Discipline.objects.filter(projects__id=dto.id)
    ]

    return ProjectDetailOut(
        uuid=dto.uuid,
        title=dto.title,
        description=dto.description,
        is_published=dto.is_published,
        is_archived=dto.is_archived,
        is_template=dto.is_template,
        is_favorite=is_favorite,
        is_archived=is_archived,
        owner_id=dto.owner_id,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
        workflows=workflows,
        permissions=permission_context_out(_project_permissions(current_user, dto)),
        disciplines=disciplines
    )


@router.post(
    "",
    response=ProjectDetailOut,
    auth=BearerAuth(),
    operation_id="createProject",
)
def create_project(request, payload: ProjectCreateIn):
    current_user = get_current_user(request)

    # verify discipline actually exist in the db, otherwise reject
    # TODO: maybe more extensive validation here?
    discipline_objs = Discipline.objects.filter(id__in=payload.disciplines)
    if discipline_objs.count() != len(payload.disciplines):
        raise ValueError("invalid discipline IDs")

    svc = get_project_service()




    try:
        dto = svc.create(
            owner_id=current_user.id,
            title=payload.title,
            description=payload.description,
            is_published=payload.is_published,
            is_template=payload.is_template,
            disciplines=payload.disciplines
        )

    # permissions edit, look at the project detail out helper

    # return ProjectDetailOut(
    #     uuid=dto.uuid,
    #     title=dto.title,
    #     description=dto.description,
    #     is_published=dto.is_published,
    #     is_template=dto.is_template,
    #     is_favorite=False,
    #     is_archived=False,
    #     owner_id=dto.owner_id,
    #     date_created=dto.date_created,
    #     modified_on=dto.modified_on,
    #     disciplines=[] # TODO: dto.disciplines
    # )

    except ValueError as exc:
        raise HttpError(422, str(exc)) from exc
    return _project_detail_out(current_user, dto)


@router.get(
    "/{uuid}/view",
    response=ProjectGraphViewOut,
    auth=BearerAuth(),
    operation_id="getProjectGraph",
)
def get_project_graph(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_project_service()
    dto = svc.get_by_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Project not found")

    permissions = _project_permissions(current_user, dto)
    if dto.is_archived and not permissions.allows(ProjectPermission.VIEW):
        raise HttpError(403, "Project archived")
    _require_project_permission(current_user, dto, ProjectPermission.VIEW)

    view = get_project_graph_view_service()
    payload = view.get_by_project_uuid(uuid)

    if payload is None:
        raise HttpError(404, "Project not found")
    return ProjectGraphViewOut.model_validate(
        {
            **payload,
            "is_archived": dto.is_archived,
            "permissions": permission_context_out(
                _project_permissions(current_user, dto)
            ),
        }
    )


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

    _require_project_permission(current_user, dto, ProjectPermission.VIEW)

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

    _require_project_permission(current_user, dto, ProjectPermission.VIEW)

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

    _require_project_permission(current_user, dto, ProjectPermission.MANAGE_MEMBERS)

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

    _require_project_permission(current_user, dto, ProjectPermission.MANAGE_MEMBERS)

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

    _require_project_permission(current_user, dto, ProjectPermission.MANAGE_MEMBERS)

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
    dto = get_project_service().get_by_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Project not found")

    permissions = _project_permissions(current_user, dto)
    if dto.is_archived and not permissions.allows(ProjectPermission.VIEW):
        raise HttpError(403, "Project archived")
    _require_project_permission(current_user, dto, ProjectPermission.VIEW)

    return ProjectDetailOutResp(item=_project_detail_out(current_user, dto))


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

    updates = payload.model_dump(exclude_unset=True)
    metadata_fields = set(updates) - {"is_published"}
    if metadata_fields or not updates:
        _require_project_permission(
            current_user,
            existing,
            ProjectPermission.EDIT_PROJECT,
        )
    if "is_published" in updates:
        _require_project_permission(
            current_user,
            existing,
            ProjectPermission.PUBLISH_PROJECT,
        )
    try:
        updated = svc.update(uuid, updates)
    except ValueError as exc:
        raise HttpError(422, str(exc)) from exc

    if updated is None:
        raise HttpError(404, "Project not found")

    return ProjectDetailOutResp(item=_project_detail_out(current_user, updated))


@router.post(
    "/{uuid}/archive",
    response=SuccessOut,
    auth=BearerAuth(),
    operation_id="archiveProject",
)
def archive_project(request, uuid: UUID):
    current_user = get_current_user(request)
    try:
        archived = get_resource_lifecycle_service().archive_project(
            project_uuid=uuid,
            user=current_user,
        )
    except AuthorizationDenied as exc:
        raise HttpError(403, "Forbidden") from exc
    if not archived:
        raise HttpError(404, "Project not found")
    return SuccessOut()


@router.post(
    "/{uuid}/restore",
    response=SuccessOut,
    auth=BearerAuth(),
    operation_id="restoreProject",
)
def restore_project(request, uuid: UUID):
    current_user = get_current_user(request)
    try:
        restored = get_resource_lifecycle_service().restore_project(
            project_uuid=uuid,
            user=current_user,
        )
    except AuthorizationDenied as exc:
        raise HttpError(403, "Forbidden") from exc
    if not restored:
        raise HttpError(404, "Project not found")
    return SuccessOut()


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

    _require_project_permission(
        current_user,
        existing,
        ProjectPermission.DELETE_PROJECT,
    )

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
            is_archived=r.is_archived,
            is_template=r.is_template,
            owner_id=r.owner_id,
            modified_on=r.modified_on,
            permissions=permission_context_out(_project_permissions(current_user, r)),
        )
        for r in rows
    ]
    return ProjectListOut(items=items, meta=ProjectListMetaOut(total=len(items)))
