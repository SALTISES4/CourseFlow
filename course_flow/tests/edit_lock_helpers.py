from uuid import UUID

from django.test import Client

from course_flow.core.models import Workflow


def acquire_project_edit_lock(
    client: Client,
    headers: dict[str, str],
    project_uuid: str | UUID,
) -> None:
    response = client.post(
        f"/api/workspace-lock/project/{project_uuid}/acquire",
        content_type="application/json",
        **headers,
    )
    assert response.status_code == 200, response.content
    assert response.json()["state"] == "held", response.content


def acquire_workflow_edit_lock(
    client: Client,
    headers: dict[str, str],
    workflow_uuid: str | UUID,
) -> None:
    response = client.post(
        f"/api/workspace-lock/workflow/{workflow_uuid}/acquire",
        content_type="application/json",
        **headers,
    )
    assert response.status_code == 200, response.content
    assert response.json()["state"] == "held", response.content


def acquire_graph_edit_lock(
    client: Client,
    headers: dict[str, str],
    graph_uuid: str | UUID,
) -> None:
    workflow_uuid = Workflow.objects.values_list("uuid", flat=True).get(
        graph__uuid=graph_uuid
    )
    acquire_workflow_edit_lock(client, headers, workflow_uuid)
