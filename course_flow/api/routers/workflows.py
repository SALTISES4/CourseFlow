from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.common.schemas import SuccessOut
from course_flow.api.deps import (
    get_authorization_service,
    get_project_service,
    get_resource_lifecycle_service,
    get_workflow_service,
)
from course_flow.api.permission_context import permission_context_out
from course_flow.api.schemas.workflows import (
    WorkflowCreateIn,
    WorkflowDetailOut,
    WorkflowDetailOutResp,
    WorkflowListItemOut,
    WorkflowListMetaOut,
    WorkflowListOut,
    WorkflowRelatedOut,
    WorkflowUpdateIn,
)
from course_flow.application.dto import WorkflowDTO
from course_flow.application.services.authorization_service import (
    AuthorizationDenied,
)
from course_flow.application.services.resource_lifecycle_service import (
    ResourceStateConflict,
)
from course_flow.core.models import User
from course_flow.core.permissions import ProjectPermission, WorkflowPermission

router = Router(tags=["workflows"], by_alias=True)


def _workflow_permissions(current_user: User, dto: WorkflowDTO):
    return get_authorization_service().permissions_for_workflow(
        user=current_user,
        workflow=dto,
    )


def _workflow_project_permissions(current_user: User, dto: WorkflowDTO):
    context = get_authorization_service().permissions_for_workflow_project(
        user=current_user,
        workflow=dto,
    )
    return permission_context_out(context) if context is not None else None


def _require_workflow_permission(
    current_user: User,
    dto: WorkflowDTO,
    action: WorkflowPermission,
) -> None:
    try:
        get_authorization_service().require_workflow(
            user=current_user,
            workflow=dto,
            action=action,
        )
    except AuthorizationDenied as exc:
        raise HttpError(403, "Forbidden") from exc


def _workflow_detail(current_user: User, dto: WorkflowDTO) -> WorkflowDetailOut:
    return WorkflowDetailOut(
        uuid=dto.workflow_uuid,
        graph_uuid=dto.graph_uuid,
        title=dto.title,
        description=dto.description,
        workflow_type=dto.workflow_type,
        author_id=dto.author_id,
        project_uuid=dto.project_uuid,
        is_archived=dto.is_archived,
        revision_id=dto.revision_id,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
        permissions=permission_context_out(_workflow_permissions(current_user, dto)),
        project_permissions=_workflow_project_permissions(current_user, dto),
    )


def _resolve_project_pk(
    project_uuid: UUID | None,
    *,
    current_user: User,
    require_create_permission: bool,
) -> int | None:
    if project_uuid is None:
        return None
    project = get_project_service().get_by_uuid(project_uuid)
    if project is None:
        raise HttpError(404, "Project not found")
    if require_create_permission:
        try:
            get_authorization_service().require_project(
                user=current_user,
                project=project,
                action=ProjectPermission.CREATE_WORKFLOW,
            )
        except AuthorizationDenied as exc:
            raise HttpError(403, "Forbidden") from exc
    return project.id


def _workflow_list_item(current_user: User, dto: WorkflowDTO) -> WorkflowListItemOut:
    return WorkflowListItemOut(
        uuid=dto.workflow_uuid,
        graph_uuid=dto.graph_uuid,
        title=dto.title,
        author_id=dto.author_id,
        project_uuid=dto.project_uuid,
        workflow_type=dto.workflow_type,
        is_archived=dto.is_archived,
        revision_id=dto.revision_id,
        modified_on=dto.modified_on,
        permissions=permission_context_out(_workflow_permissions(current_user, dto)),
        project_permissions=_workflow_project_permissions(current_user, dto),
    )


def _updates_with_resolved_project(
    updates: dict,
    *,
    current_user: User,
) -> dict:
    if "project_uuid" not in updates:
        return updates
    resolved = dict(updates)
    project_uuid = resolved.pop("project_uuid")
    resolved["project_id"] = _resolve_project_pk(
        project_uuid,
        current_user=current_user,
        require_create_permission=project_uuid is not None,
    )
    return resolved


@router.post(
    "",
    response=WorkflowDetailOut,
    auth=BearerAuth(),
    operation_id="createWorkflow",
)
def create_workflow(request, payload: WorkflowCreateIn):
    current_user = get_current_user(request)
    svc = get_workflow_service()
    try:
        dto = svc.create(
            author_id=current_user.id,
            project_id=_resolve_project_pk(
                payload.project_uuid,
                current_user=current_user,
                require_create_permission=payload.project_uuid is not None,
            ),
            title=payload.title,
            workflow_type=payload.workflow_type.value,
            description=payload.description,
        )
    except ValueError as exc:
        raise HttpError(422, str(exc)) from exc
    return _workflow_detail(current_user, dto)


@router.get(
    "/{uuid}",
    response=WorkflowDetailOutResp,
    auth=BearerAuth(),
    operation_id="getWorkflow",
)
def get_workflow(request, uuid: UUID):
    current_user = get_current_user(request)
    svc = get_workflow_service()
    dto = svc.get_by_workflow_uuid(uuid)
    if dto is None:
        raise HttpError(404, "Workflow not found")
    permissions = _workflow_permissions(current_user, dto)
    if (
        dto.is_archived or dto.project_is_archived
    ) and not permissions.allows(WorkflowPermission.VIEW):
        raise HttpError(403, "Workflow archived")
    _require_workflow_permission(current_user, dto, WorkflowPermission.VIEW)
    return WorkflowDetailOutResp(item=_workflow_detail(current_user, dto))


@router.patch(
    "/{uuid}",
    response=WorkflowDetailOutResp,
    auth=BearerAuth(),
    operation_id="updateWorkflow",
)
def update_workflow(request, uuid: UUID, payload: WorkflowUpdateIn):
    current_user = get_current_user(request)
    svc = get_workflow_service()
    existing = svc.get_by_workflow_uuid(uuid)
    if existing is None:
        raise HttpError(404, "Workflow not found")
    _require_workflow_permission(
        current_user,
        existing,
        WorkflowPermission.EDIT_ATTRIBUTES,
    )
    updates = _updates_with_resolved_project(
        payload.model_dump(exclude_unset=True),
        current_user=current_user,
    )
    dto = svc.update_by_workflow_uuid(uuid, updates)
    if dto is None:
        raise HttpError(404, "Workflow not found")
    return WorkflowDetailOutResp(item=_workflow_detail(current_user, dto))


@router.post(
    "/{uuid}/archive",
    response=SuccessOut,
    auth=BearerAuth(),
    operation_id="archiveWorkflow",
)
def archive_workflow(request, uuid: UUID):
    current_user = get_current_user(request)
    try:
        archived = get_resource_lifecycle_service().archive_workflow(
            workflow_uuid=uuid,
            user=current_user,
        )
    except AuthorizationDenied as exc:
        raise HttpError(403, "Forbidden") from exc
    if not archived:
        raise HttpError(404, "Workflow not found")
    return SuccessOut()


@router.post(
    "/{uuid}/restore",
    response=SuccessOut,
    auth=BearerAuth(),
    operation_id="restoreWorkflow",
)
def restore_workflow(request, uuid: UUID):
    current_user = get_current_user(request)
    try:
        restored = get_resource_lifecycle_service().restore_workflow(
            workflow_uuid=uuid,
            user=current_user,
        )
    except AuthorizationDenied as exc:
        raise HttpError(403, "Forbidden") from exc
    except ResourceStateConflict as exc:
        raise HttpError(409, str(exc)) from exc
    if not restored:
        raise HttpError(404, "Workflow not found")
    return SuccessOut()


@router.delete(
    "/{uuid}",
    response=SuccessOut,
    auth=BearerAuth(),
    operation_id="deleteWorkflowPermanently",
)
def delete_workflow_permanently(request, uuid: UUID):
    current_user = get_current_user(request)
    try:
        deleted = get_resource_lifecycle_service().delete_workflow_permanently(
            workflow_uuid=uuid,
            user=current_user,
        )
    except AuthorizationDenied as exc:
        raise HttpError(403, "Forbidden") from exc
    if not deleted:
        raise HttpError(404, "Workflow not found")
    return SuccessOut()


@router.get(
    "/{uuid}/related",
    response=WorkflowRelatedOut,
    auth=BearerAuth(),
    operation_id="getRelatedWorkflows",
)
def get_related_workflows(request, uuid: UUID):
    current_user = get_current_user(request)
    workflow = get_workflow_service().get_by_workflow_uuid(uuid)
    if workflow is None:
        raise HttpError(404, "Workflow not found")
    _require_workflow_permission(current_user, workflow, WorkflowPermission.VIEW)

    contains, appears_in = get_workflow_service().list_related(uuid)

    def visible_items(rows: list[WorkflowDTO]) -> list[WorkflowListItemOut]:
        return [
            _workflow_list_item(current_user, row)
            for row in rows
            if _workflow_permissions(current_user, row).allows(WorkflowPermission.VIEW)
        ]

    return WorkflowRelatedOut(
        contains=visible_items(contains),
        appears_in=visible_items(appears_in),
    )


@router.get(
    "",
    response=WorkflowListOut,
    auth=BearerAuth(),
    operation_id="listWorkflows",
)
def list_workflows(request):
    current_user = get_current_user(request)
    svc = get_workflow_service()
    rows = svc.list_for_author(current_user.id)
    items = [_workflow_list_item(current_user, r) for r in rows]
    return WorkflowListOut(items=items, meta=WorkflowListMetaOut(total=len(items)))
