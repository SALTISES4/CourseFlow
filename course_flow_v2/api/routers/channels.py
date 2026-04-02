from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow_v2.api.auth import BearerAuth, get_current_user
from course_flow_v2.api.common.schemas import SuccessOut
from course_flow_v2.api.deps import get_channel_service, get_workflow_service
from course_flow_v2.api.permissions import can_view_workflow
from course_flow_v2.api.schemas.channels import (
    ChannelCreateIn,
    ChannelListMetaOut,
    ChannelListOut,
    ChannelOut,
    ChannelOutResp,
    ChannelPatchIn,
)
from course_flow_v2.application.dto import ChannelDTO

workflow_collection_router = Router(tags=["channels"], by_alias=True)
resource_router = Router(tags=["channels"], by_alias=True)


def _channel_out(dto: ChannelDTO) -> ChannelOut:
    return ChannelOut(
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
    "/{uuid}/channels",
    response=ChannelListOut,
    auth=BearerAuth(),
    operation_id="listWorkflowChannels",
)
def list_workflow_channels(request, uuid: UUID):
    current_user = get_current_user(request)
    _ensure_workflow_owner(uuid, current_user)

    rows = get_channel_service().list_for_workflow_uuid(uuid)

    items = [_channel_out(r) for r in rows]

    return ChannelListOut(items=items, meta=ChannelListMetaOut(total=len(items)))


@resource_router.post(
    "",
    response=ChannelOut,
    auth=BearerAuth(),
    operation_id="createChannel",
)
def create_channel(request, payload: ChannelCreateIn):
    current_user = get_current_user(request)
    _ensure_workflow_owner(payload.workflow_uuid, current_user)

    dto = get_channel_service().create(
        workflow_uuid=payload.workflow_uuid,
        title=payload.title,
        position=payload.position,
        thread_uuid=payload.thread_uuid,
    )

    if dto is None:
        raise HttpError(404, "Related resource not found")

    return _channel_out(dto)


@resource_router.get(
    "/{uuid}",
    response=ChannelOutResp,
    auth=BearerAuth(),
    operation_id="getChannel",
)
def get_channel(request, uuid: UUID):
    current_user = get_current_user(request)
    dto = get_channel_service().get_by_uuid(uuid)
    if dto is None:
        raise HttpError(404, "Channel not found")
    wf = get_workflow_service().get_by_uuid(dto.workflow_uuid)
    if wf is None:
        raise HttpError(404, "Workflow not found")
    if not can_view_workflow(current_user=current_user, workflow=wf):
        raise HttpError(403, "Forbidden")
    return ChannelOutResp(item=_channel_out(dto))


@resource_router.patch(
    "/{uuid}",
    response=ChannelOutResp,
    auth=BearerAuth(),
    operation_id="updateChannel",
)
def update_channel(request, uuid: UUID, payload: ChannelPatchIn):
    current_user = get_current_user(request)
    existing = get_channel_service().get_by_uuid(uuid)
    if existing is None:
        raise HttpError(404, "Channel not found")
    wf = get_workflow_service().get_by_uuid(existing.workflow_uuid)
    if wf is None:
        raise HttpError(404, "Workflow not found")
    if not can_view_workflow(current_user=current_user, workflow=wf):
        raise HttpError(403, "Forbidden")

    updates = payload.model_dump(exclude_unset=True)
    dto = get_channel_service().update(uuid, updates)
    if dto is None:
        raise HttpError(404, "Related resource not found")
    return ChannelOutResp(item=_channel_out(dto))


@resource_router.delete(
    "/{uuid}",
    response=SuccessOut,
    auth=BearerAuth(),
    operation_id="deleteChannel",
)
def delete_channel(request, uuid: UUID):
    current_user = get_current_user(request)
    existing = get_channel_service().get_by_uuid(uuid)

    if existing is None:
        raise HttpError(404, "Channel not found")
    wf = get_workflow_service().get_by_uuid(existing.workflow_uuid)

    if wf is None:
        raise HttpError(404, "Workflow not found")

    if not can_view_workflow(current_user=current_user, workflow=wf):
        raise HttpError(403, "Forbidden")

    deleted = get_channel_service().delete(uuid)

    if not deleted:
        raise HttpError(404, "Channel not found")

    return SuccessOut()
