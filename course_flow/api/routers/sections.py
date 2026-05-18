from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.deps import (
    get_graph_mutation_service,
    get_section_service,
    get_workflow_service,
)
from course_flow.api.graph_common import graph_mutation_http
from course_flow.api.permissions import can_view_graph
from course_flow.api.schemas.graph_mutation import (
    GraphMutationEnvelopeOut,
    GraphReorderSectionsIn,
    GraphSectionInsertBelowIn,
)
from course_flow.api.schemas.sections import (
    GraphSectionCreateIn,
    SectionCreateIn,
    SectionListMetaOut,
    SectionListOut,
    SectionOut,
    SectionOutResp,
    SectionPatchIn,
)
from course_flow.application.dto import SectionDTO

graph_collection_router = Router(tags=["sections"], by_alias=True)
resource_router = Router(tags=["sections"], by_alias=True)


def _section_out(dto: SectionDTO) -> SectionOut:
    return SectionOut(
        uuid=dto.uuid,
        graph_uuid=dto.graph_uuid,
        title=dto.title,
        position=dto.position,
        thread_uuid=dto.thread_uuid,
        date_created=dto.date_created,
        modified_on=dto.modified_on,
    )


def _ensure_graph_owner(uuid: UUID, current_user) -> None:
    dto = get_workflow_service().get_by_graph_uuid(uuid)

    if dto is None:
        raise HttpError(404, "Graph not found")

    if not can_view_graph(current_user=current_user, graph=dto):
        raise HttpError(403, "Forbidden")


@graph_collection_router.get(
    "/{uuid}/sections",
    response=SectionListOut,
    auth=BearerAuth(),
    operation_id="listGraphSections",
)
def list_graph_sections(request, uuid: UUID):
    current_user = get_current_user(request)
    _ensure_graph_owner(uuid, current_user)

    rows = get_section_service().list_for_graph_uuid(uuid)
    items = [_section_out(r) for r in rows]

    return SectionListOut(items=items, meta=SectionListMetaOut(total=len(items)))


@graph_collection_router.post(
    "/{uuid}/sections",
    response=SectionOut,
    auth=BearerAuth(),
    operation_id="createGraphSection",
)
def create_graph_section(
    request, uuid: UUID, payload: GraphSectionCreateIn
):
    current_user = get_current_user(request)
    _ensure_graph_owner(uuid, current_user)

    dto = get_section_service().create(
        graph_uuid=uuid,
        title=payload.title,
        position=payload.position,
        thread_uuid=payload.thread_uuid,
    )

    if dto is None:
        raise HttpError(404, "Related resource not found")

    return _section_out(dto)


@graph_collection_router.post(
    "/{uuid}/sections/insert-below",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="insertGraphSectionBelow",
)
def insert_graph_section_below(
    request, uuid: UUID, payload: GraphSectionInsertBelowIn
):
    current_user = get_current_user(request)
    _ensure_graph_owner(uuid, current_user)
    svc = get_graph_mutation_service()
    out, err = svc.insert_section_below(
        graph_uuid=uuid,
        user_id=current_user.id,
        section_uuid=payload.section_uuid,
        duplicate=payload.duplicate,
    )
    return graph_mutation_http(out, err)


@graph_collection_router.put(
    "/{uuid}/sections/order",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="reorderGraphSections",
)
def reorder_graph_sections(request, uuid: UUID, payload: GraphReorderSectionsIn):
    current_user = get_current_user(request)
    _ensure_graph_owner(uuid, current_user)
    svc = get_graph_mutation_service()
    out, err = svc.reorder_sections(
        graph_uuid=uuid,
        user_id=current_user.id,
        section_uuids=payload.section_uuids,
    )
    return graph_mutation_http(out, err)


@resource_router.post(
    "",
    response=SectionOut,
    auth=BearerAuth(),
    operation_id="createSection",
)
def create_section(request, payload: SectionCreateIn):
    current_user = get_current_user(request)
    _ensure_graph_owner(payload.uuid, current_user)

    dto = get_section_service().create(
        graph_uuid=payload.graph_uuid,
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

    wf = get_workflow_service().get_by_graph_uuid(dto.graph_uuid)

    if wf is None:
        raise HttpError(404, "Graph not found")

    if not can_view_graph(current_user=current_user, graph=wf):
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
    wf = get_workflow_service().get_by_graph_uuid(existing.graph_uuid)

    if wf is None:
        raise HttpError(404, "Graph not found")

    if not can_view_graph(current_user=current_user, graph=wf):
        raise HttpError(403, "Forbidden")

    updates = payload.model_dump(exclude_unset=True)
    dto = get_section_service().update(uuid, updates)

    if dto is None:
        raise HttpError(404, "Related resource not found")

    return SectionOutResp(item=_section_out(dto))


@resource_router.delete(
    "/{uuid}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="deleteSection",
)
def delete_section(request, uuid: UUID):
    current_user = get_current_user(request)
    existing = get_section_service().get_by_uuid(uuid)

    if existing is None:
        raise HttpError(404, "Section not found")
    wf = get_workflow_service().get_by_graph_uuid(existing.graph_uuid)

    if wf is None:
        raise HttpError(404, "Graph not found")

    if not can_view_graph(current_user=current_user, graph=wf):
        raise HttpError(403, "Forbidden")

    svc = get_graph_mutation_service()
    payload, err = svc.delete_section(
        user_id=current_user.id,
        section_uuid=uuid,
    )
    return graph_mutation_http(payload, err)
