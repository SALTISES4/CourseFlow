from __future__ import annotations

from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow.api.auth import BearerAuth, get_current_user
from course_flow.api.deps import get_graph_mutation_service
from course_flow.api.graph_common import graph_mutation_http
from course_flow.api.schemas.graph_mutation import (
    GraphMutationEnvelopeOut,
    GraphUndoStatusOut,
)
from course_flow.api.workspace_edit_locks import workspace_mutation_lock
from course_flow.application.services.workspace_edit_lock_service import (
    WorkspaceReferenceType,
)

router = Router(tags=["graph-undo"], by_alias=True)


@router.get(
    "/{uuid}/undo",
    response=GraphUndoStatusOut,
    auth=BearerAuth(),
    operation_id="getGraphUndoStatus",
)
def get_graph_undo_status(request, uuid: UUID):
    current_user = get_current_user(request)
    payload, err = get_graph_mutation_service().get_undo_status(
        graph_uuid=uuid,
        user_id=current_user.id,
    )
    if err == "forbidden":
        raise HttpError(403, "Forbidden")
    if err == "not_found" or payload is None:
        raise HttpError(404, "Not found")
    return GraphUndoStatusOut.model_validate(payload)


@router.post(
    "/{uuid}/undo",
    response=GraphMutationEnvelopeOut,
    auth=BearerAuth(),
    operation_id="undoGraphMutation",
)
@workspace_mutation_lock(WorkspaceReferenceType.GRAPH)
def undo_graph_mutation(request, uuid: UUID):
    current_user = get_current_user(request)
    payload, err = get_graph_mutation_service().undo(
        graph_uuid=uuid,
        user_id=current_user.id,
    )
    return graph_mutation_http(payload, err)
