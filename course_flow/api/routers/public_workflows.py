from copy import deepcopy
from uuid import UUID

from ninja import Router
from ninja.errors import HttpError

from course_flow.api.deps import get_graph_view_service, get_workflow_service
from course_flow.api.schemas.graph_view import GraphViewOut
from course_flow.api.schemas.permissions import PermissionContextOut
from course_flow.api.schemas.workflows import (
    PublicWorkflowDetailOut,
    PublicWorkflowDetailOutResp,
)
from course_flow.application.dto import WorkflowDTO
from course_flow.core.permissions import ResourceRole, WorkflowPermission

router = Router(tags=["public-workflows"], by_alias=True)


def _anonymous_permissions() -> PermissionContextOut:
    return PermissionContextOut(
        account_role=None,
        resource_role=ResourceRole.PUBLIC,
        state="public-link",
        actions=[WorkflowPermission.VIEW],
        admin_override=False,
    )


def _public_workflow_or_404(uuid: UUID) -> WorkflowDTO:
    workflow = get_workflow_service().get_by_workflow_uuid(uuid)
    if (
        workflow is None
        or not workflow.public_link_enabled
        or workflow.is_archived
        or workflow.project_is_archived
    ):
        raise HttpError(404, "Workflow not found")
    return workflow


@router.get(
    "/workflow/{uuid}",
    response=PublicWorkflowDetailOutResp,
    operation_id="getPublicWorkflow",
)
def get_public_workflow(request, uuid: UUID):
    workflow = _public_workflow_or_404(uuid)
    return PublicWorkflowDetailOutResp(
        item=PublicWorkflowDetailOut(
            uuid=workflow.workflow_uuid,
            graph_uuid=workflow.graph_uuid,
            title=workflow.title,
            description=workflow.description,
            overview_metadata=workflow.overview_metadata,
            workflow_type=workflow.workflow_type,
            date_created=workflow.date_created,
            modified_on=workflow.modified_on,
            permissions=_anonymous_permissions(),
        )
    )


@router.get(
    "/graph/{uuid}/view",
    response=GraphViewOut,
    operation_id="getPublicGraphView",
)
def get_public_graph_view(request, uuid: UUID):
    workflow = _public_workflow_or_404(uuid)
    payload = get_graph_view_service().get_by_graph_uuid(workflow.graph_uuid)
    if payload is None:
        raise HttpError(404, "Graph not found")

    public_payload = deepcopy(payload)
    public_payload["graph"]["author_id"] = None
    public_payload["graph"]["workflow_project_id"] = None
    for collection in ("sections", "channels", "nodes", "outcomes"):
        for item in public_payload[collection]:
            item["thread_uuid"] = None
    for node in public_payload["nodes"]:
        node["linked_workflow_uuid"] = None
    public_payload["thread_comment_counts"] = []

    return GraphViewOut.model_validate(
        {
            **public_payload,
            "permissions": _anonymous_permissions(),
            "project_permissions": None,
        }
    )
