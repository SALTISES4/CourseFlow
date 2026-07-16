from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.deps import (
    get_graph_mutation_service,
    get_workflow_service,
)
from course_flow.api.graph_common import graph_mutation_http
from course_flow.api.permissions import has_workflow_permission
from course_flow.api.schemas.graph_mutation import (
    GraphMutationEnvelopeOut,
    GraphOutcomeCreateIn,
    GraphOutcomeMoveIn,
    GraphOutcomePatchIn,
)
from course_flow.core.models import Outcome
from course_flow.core.permissions import WorkflowPermission

graph_collection_router = Router(tags=["outcomes"], by_alias=True)
outcome_resource_router = Router(tags=["outcomes"], by_alias=True)


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


def _ensure_outcome_permission(
    uuid: UUID,
    current_user,
    action: WorkflowPermission,
) -> None:
    try:
        outcome = Outcome.objects.select_related("graph__workflow__project").get(
            uuid=uuid
        )
    except Outcome.DoesNotExist as exc:
        raise HttpError(404, "Outcome not found") from exc
    if not has_workflow_permission(
        current_user=current_user,
        workflow=outcome.graph,
        action=action,
    ):
        raise HttpError(403, "Forbidden")


@graph_collection_router.post(
    "/{uuid}/outcomes",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="createGraphOutcome",
)
def create_graph_outcome(request, uuid: UUID, payload: GraphOutcomeCreateIn):
    current_user = get_current_user(request)
    _ensure_graph_permission(
        uuid,
        current_user,
        WorkflowPermission.OUTCOME_MANAGEMENT,
    )

    out, err = get_graph_mutation_service().create_outcome(
        graph_uuid=uuid,
        user_id=current_user.id,
        parent_uuid=payload.parent_uuid,
        insert_index=payload.insert_index,
        title=payload.title,
        description=payload.description,
        code=payload.code,
        tag_ids=payload.tag_ids,
    )
    return graph_mutation_http(out, err)


@outcome_resource_router.patch(
    "/{uuid}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="patchOutcome",
)
def patch_outcome(request, uuid: UUID, payload: GraphOutcomePatchIn):
    current_user = get_current_user(request)
    _ensure_outcome_permission(
        uuid,
        current_user,
        WorkflowPermission.OUTCOME_MANAGEMENT,
    )

    out, err = get_graph_mutation_service().update_outcome(
        user_id=current_user.id,
        outcome_uuid=uuid,
        title=payload.title,
        description=payload.description,
        code=payload.code,
        tag_ids=payload.tag_ids,
    )
    return graph_mutation_http(out, err)


@outcome_resource_router.delete(
    "/{uuid}",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="deleteOutcome",
)
def delete_outcome(request, uuid: UUID):
    current_user = get_current_user(request)
    _ensure_outcome_permission(
        uuid,
        current_user,
        WorkflowPermission.OUTCOME_MANAGEMENT,
    )

    out, err = get_graph_mutation_service().delete_outcome(
        user_id=current_user.id,
        outcome_uuid=uuid,
    )
    return graph_mutation_http(out, err)


@outcome_resource_router.post(
    "/{uuid}/duplicate",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="duplicateOutcome",
)
def duplicate_outcome(request, uuid: UUID):
    current_user = get_current_user(request)
    _ensure_outcome_permission(
        uuid,
        current_user,
        WorkflowPermission.OUTCOME_MANAGEMENT,
    )

    out, err = get_graph_mutation_service().duplicate_outcome(
        user_id=current_user.id,
        outcome_uuid=uuid,
    )
    return graph_mutation_http(out, err)


@outcome_resource_router.post(
    "/{uuid}/move",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="moveOutcome",
)
def move_outcome(request, uuid: UUID, payload: GraphOutcomeMoveIn):
    current_user = get_current_user(request)
    _ensure_outcome_permission(
        uuid,
        current_user,
        WorkflowPermission.OUTCOME_MANAGEMENT,
    )

    out, err = get_graph_mutation_service().move_outcome(
        user_id=current_user.id,
        outcome_uuid=uuid,
        parent_uuid=payload.parent_uuid,
        parent_uuid_provided="parent_uuid" in payload.model_fields_set,
        insert_index=payload.insert_index,
        before_uuid=payload.before_uuid,
        after_uuid=payload.after_uuid,
    )
    return graph_mutation_http(out, err)
