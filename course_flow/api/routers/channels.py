from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.deps import (
    get_channel_service,
    get_graph_mutation_service,
    get_workflow_service,
)
from course_flow.api.graph_common import graph_mutation_http
from course_flow.api.permissions import has_workflow_permission
from course_flow.api.schemas.channels import (
    ChannelCreateIn,
    ChannelListMetaOut,
    ChannelListOut,
    ChannelOut,
    ChannelOutResp,
    ChannelPatchIn,
)
from course_flow.api.schemas.graph_mutation import (
    GraphChannelInsertBelowIn,
    GraphMutationEnvelopeOut,
    GraphReorderChannelsIn,
)
from course_flow.application.dto import ChannelDTO
from course_flow.core.permissions import WorkflowPermission

graph_collection_router = Router(tags=["channels"], by_alias=True)
resource_router = Router(tags=["channels"], by_alias=True)


def _channel_out(dto: ChannelDTO) -> ChannelOut:
    return ChannelOut(
        uuid=dto.uuid,
        graph_uuid=dto.graph_uuid,
        title=dto.title,
        colour=dto.colour,
        position=dto.position,
        thread_uuid=dto.thread_uuid,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
    )


def _ensure_graph_permission(
    uuid: UUID,
    current_user,
    action: WorkflowPermission,
) -> None:
    dto = get_workflow_service().get_by_graph_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Graph not found")

    if not has_workflow_permission(
        current_user=current_user,
        workflow=dto,
        action=action,
    ):
        raise HttpError(403, "Forbidden")


@graph_collection_router.get(
    "/{uuid}/channels",
    response=ChannelListOut,
    auth=BearerAuth(),
    operation_id="listGraphChannels",
)
def list_graph_channels(request, uuid: UUID):
    current_user = get_current_user(request)
    _ensure_graph_permission(uuid, current_user, WorkflowPermission.VIEW)

    rows = get_channel_service().list_for_graph_uuid(uuid)

    items = [_channel_out(r) for r in rows]

    return ChannelListOut(items=items, meta=ChannelListMetaOut(total=len(items)))


@graph_collection_router.post(
    "/{uuid}/channels/insert-below",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="insertGraphChannelBelow",
)
def insert_graph_channel_below(
    request, uuid: UUID, payload: GraphChannelInsertBelowIn
):
    current_user = get_current_user(request)
    _ensure_graph_permission(
        uuid,
        current_user,
        WorkflowPermission.NODE_CATEGORY_MANAGEMENT,
    )
    svc = get_graph_mutation_service()
    out, err = svc.insert_channel_below(
        graph_uuid=uuid,
        user_id=current_user.id,
        channel_uuid=payload.channel_uuid,
        duplicate=payload.duplicate,
    )
    return graph_mutation_http(out, err)


@graph_collection_router.put(
    "/{uuid}/channels/order",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="reorderGraphChannels",
)
def reorder_graph_channels(request, uuid: UUID, payload: GraphReorderChannelsIn):
    current_user = get_current_user(request)
    _ensure_graph_permission(
        uuid,
        current_user,
        WorkflowPermission.NODE_CATEGORY_MANAGEMENT,
    )
    svc = get_graph_mutation_service()
    out, err = svc.reorder_channels(
        graph_uuid=uuid,
        user_id=current_user.id,
        channel_uuids=payload.channel_uuids,
    )
    return graph_mutation_http(out, err)


@resource_router.post(
    "",
    response=ChannelOut,
    auth=BearerAuth(),
    operation_id="createChannel",
)
def create_channel(request, payload: ChannelCreateIn):
    current_user = get_current_user(request)
    _ensure_graph_permission(
        payload.graph_uuid,
        current_user,
        WorkflowPermission.NODE_CATEGORY_MANAGEMENT,
    )

    dto = get_channel_service().create(
        graph_uuid=payload.graph_uuid,
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
    wf = get_workflow_service().get_by_graph_uuid(dto.graph_uuid)
    if wf is None:
        raise HttpError(404, "Graph not found")
    if not has_workflow_permission(
        current_user=current_user,
        workflow=wf,
        action=WorkflowPermission.VIEW,
    ):
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
    wf = get_workflow_service().get_by_graph_uuid(existing.graph_uuid)
    if wf is None:
        raise HttpError(404, "Graph not found")
    if not has_workflow_permission(
        current_user=current_user,
        workflow=wf,
        action=WorkflowPermission.NODE_CATEGORY_MANAGEMENT,
    ):
        raise HttpError(403, "Forbidden")

    updates = payload.model_dump(exclude_unset=True)
    dto = get_channel_service().update(uuid, updates)
    if dto is None:
        raise HttpError(404, "Related resource not found")
    return ChannelOutResp(item=_channel_out(dto))


@resource_router.delete(
    "/{uuid}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="deleteChannel",
)
def delete_channel(request, uuid: UUID):
    current_user = get_current_user(request)
    existing = get_channel_service().get_by_uuid(uuid)

    if existing is None:
        raise HttpError(404, "Channel not found")
    wf = get_workflow_service().get_by_graph_uuid(existing.graph_uuid)

    if wf is None:
        raise HttpError(404, "Graph not found")

    if not has_workflow_permission(
        current_user=current_user,
        workflow=wf,
        action=WorkflowPermission.NODE_CATEGORY_MANAGEMENT,
    ):
        raise HttpError(403, "Forbidden")

    svc = get_graph_mutation_service()
    payload, err = svc.delete_channel(
        user_id=current_user.id,
        channel_uuid=uuid,
    )
    return graph_mutation_http(payload, err)
