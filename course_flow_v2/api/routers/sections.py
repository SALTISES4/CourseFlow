from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.common.schemas import SuccessOut
from course_flow_v2.api.deps import get_section_service, get_workflow_service
from course_flow_v2.api.permissions import can_view_workflow
from course_flow_v2.api.schemas.sections import (
    SectionCreateIn,
    SectionListMetaOut,
    SectionListOut,
    SectionOut,
    SectionOutResp,
    SectionPatchIn,
    WorkflowSectionCreateIn,
)
from course_flow_v2.application.dto import SectionDTO

workflow_collection_router = Router(tags=["sections"], by_alias=True)
resource_router = Router(tags=["sections"], by_alias=True)


def _section_out(dto: SectionDTO) -> SectionOut:
    return SectionOut(
        uuid=dto.uuid,
        workflow_uuid=dto.workflow_uuid,
        title=dto.title,
        position=dto.position,
        thread_uuid=dto.thread_uuid,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
    )


def _ensure_workflow_owner(uuid: UUID, current_user) -> None:
    dto = get_workflow_service().get_by_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Workflow not found")

    if not can_view_workflow(current_user=current_user, workflow=dto):
        raise HttpError(403, "Forbidden")


@workflow_collection_router.get(
    "/{uuid}/sections",
    response=SectionListOut,
    auth=BearerAuth(),
    operation_id="listWorkflowSections",
)
def list_workflow_sections(request, uuid: UUID):
    current_user = get_current_user(request)
    _ensure_workflow_owner(uuid, current_user)

    rows = get_section_service().list_for_workflow_uuid(uuid)
    items = [_section_out(r) for r in rows]

    return SectionListOut(items=items, meta=SectionListMetaOut(total=len(items)))


@workflow_collection_router.post(
    "/{uuid}/sections",
    response=SectionOut,
    auth=BearerAuth(),
    operation_id="createWorkflowSection",
)
def create_workflow_section(
    request, uuid: UUID, payload: WorkflowSectionCreateIn
):
    current_user = get_current_user(request)
    _ensure_workflow_owner(uuid, current_user)

    dto = get_section_service().create(
        workflow_uuid=uuid,
        title=payload.title,
        position=payload.position,
        thread_uuid=payload.thread_uuid,
    )

    if dto is None:
        raise HttpError(404, "Related resource not found")

    return _section_out(dto)


@resource_router.post(
    "",
    response=SectionOut,
    auth=BearerAuth(),
    operation_id="createSection",
)
def create_section(request, payload: SectionCreateIn):
    current_user = get_current_user(request)
    _ensure_workflow_owner(payload.uuid, current_user)

    dto = get_section_service().create(
        uuid=payload.uuid,
        title=payload.title,
        position=payload.position,
        thread_uuid=payload.thread_uuid,
    )

    if dto is None:
        raise HttpError(404, "Related resource not found")

    return _section_out(dto)


@resource_router.get(
    "/{uuid}",
    response=SectionOutResp,
    auth=BearerAuth(),
    operation_id="getSection",
)
def get_section(request, uuid: UUID):
    current_user = get_current_user(request)
    dto = get_section_service().get_by_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Section not found")

    wf = get_workflow_service().get_by_uuid(dto.workflow_uuid)

    if wf is None:
        raise HttpError(404, "Workflow not found")

    if not can_view_workflow(current_user=current_user, workflow=wf):
        raise HttpError(403, "Forbidden")

    return SectionOutResp(item=_section_out(dto))


@resource_router.patch(
    "/{uuid}", response=SectionOutResp, auth=BearerAuth(), operation_id="updateSection"
)
def update_section(request, uuid: UUID, payload: SectionPatchIn):
    current_user = get_current_user(request)
    existing = get_section_service().get_by_uuid(uuid)

    if existing is None:
        raise HttpError(404, "Section not found")
    wf = get_workflow_service().get_by_uuid(existing.workflow_uuid)

    if wf is None:
        raise HttpError(404, "Workflow not found")

    if not can_view_workflow(current_user=current_user, workflow=wf):
        raise HttpError(403, "Forbidden")

    updates = payload.model_dump(exclude_unset=True)
    dto = get_section_service().update(uuid, updates)

    if dto is None:
        raise HttpError(404, "Related resource not found")

    return SectionOutResp(item=_section_out(dto))


@resource_router.delete(
    "/{uuid}",
    response=SuccessOut,
    auth=BearerAuth(),
    operation_id="deleteSection",
)
def delete_section(request, uuid: UUID):
    current_user = get_current_user(request)
    existing = get_section_service().get_by_uuid(uuid)

    if existing is None:
        raise HttpError(404, "Section not found")
    wf = get_workflow_service().get_by_uuid(existing.workflow_uuid)

    if wf is None:
        raise HttpError(404, "Workflow not found")

    if not can_view_workflow(current_user=current_user, workflow=wf):
        raise HttpError(403, "Forbidden")

    deleted = get_section_service().delete(uuid)

    if not deleted:
        raise HttpError(404, "Section not found")

    return SuccessOut()
