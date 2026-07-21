from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.enum import AccountRole, TeamRole
from course_flow.core.models import (
    Authtoken,
    Channel,
    Graph,
    Node,
    Project,
    Section,
    TeamUser,
    Thread,
    Workflow,
)


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def users():
    User = get_user_model()
    return {
        name: User.objects.create_user(
            email=f"permission-{name}@example.com",
            password="password123",
        )
        for name in ("owner", "editor", "viewer", "outsider", "admin")
    }


@pytest.fixture
def project(users) -> Project:
    project = Project.objects.create(owner=users["owner"], title="API permissions")
    TeamUser.objects.create(
        team=project.team,
        user=users["editor"],
        role=TeamRole.EDITOR,
    )
    TeamUser.objects.create(
        team=project.team,
        user=users["viewer"],
        role=TeamRole.VIEWER,
    )
    return project


def _auth_header(user) -> dict[str, str]:
    now = timezone.now()
    raw = generate_raw_token()
    Authtoken.objects.create(
        user=user,
        token_hash=hash_token(raw),
        expires_at=now + timedelta(hours=1),
        last_used_at=now,
    )
    return {"HTTP_AUTHORIZATION": f"Bearer {raw}"}


@pytest.mark.django_db
def test_project_detail_returns_effective_permission_context(client, project, users):
    response = client.get(
        f"/api/project/{project.uuid}",
        **_auth_header(users["editor"]),
    )

    assert response.status_code == 200, response.content
    permissions = response.json()["item"]["permissions"]
    assert permissions["accountRole"] == "student"
    assert permissions["resourceRole"] == "editor"
    assert permissions["state"] == "private"
    assert "edit_project" in permissions["actions"]
    assert "manage_members" in permissions["actions"]
    assert "archive_project" not in permissions["actions"]


@pytest.mark.django_db
def test_private_non_contributor_is_denied_then_gets_public_read_only_access(
    client,
    project,
    users,
):
    headers = _auth_header(users["outsider"])

    denied = client.get(f"/api/project/{project.uuid}", **headers)
    assert denied.status_code == 403

    project.is_published = True
    project.save(update_fields=["is_published"])
    allowed = client.get(f"/api/project/{project.uuid}", **headers)

    assert allowed.status_code == 200, allowed.content
    permissions = allowed.json()["item"]["permissions"]
    assert permissions["resourceRole"] == "public"
    assert permissions["actions"] == ["view"]


@pytest.mark.django_db
def test_editor_can_edit_publish_manage_members_and_create_workflow(
    client,
    project,
    users,
):
    headers = _auth_header(users["editor"])

    updated = client.patch(
        f"/api/project/{project.uuid}",
        data={"title": "Editor update", "isPublished": True},
        content_type="application/json",
        **headers,
    )
    created_workflow = client.post(
        "/api/workflow",
        data={
            "projectUuid": str(project.uuid),
            "title": "Editor workflow",
            "workflowType": "course",
        },
        content_type="application/json",
        **headers,
    )
    team = client.get(f"/api/project/{project.uuid}/team", **headers)

    assert updated.status_code == 200, updated.content
    assert updated.json()["item"]["isPublished"] is True
    assert created_workflow.status_code == 200, created_workflow.content
    assert created_workflow.json()["permissions"]["resourceRole"] == "owner"
    assert "manage_members" in created_workflow.json()["projectPermissions"]["actions"]
    assert team.status_code == 200


@pytest.mark.django_db
def test_viewer_cannot_edit_manage_members_or_create_workflow(
    client,
    project,
    users,
):
    headers = _auth_header(users["viewer"])

    updated = client.patch(
        f"/api/project/{project.uuid}",
        data={"title": "Forbidden"},
        content_type="application/json",
        **headers,
    )
    added = client.post(
        f"/api/project/{project.uuid}/team",
        data={"userUuids": [str(users["outsider"].uuid)], "role": "viewer"},
        content_type="application/json",
        **headers,
    )
    created_workflow = client.post(
        "/api/workflow",
        data={
            "projectUuid": str(project.uuid),
            "title": "Forbidden",
            "workflowType": "course",
        },
        content_type="application/json",
        **headers,
    )

    assert updated.status_code == 403
    assert added.status_code == 403
    assert created_workflow.status_code == 403


@pytest.mark.django_db
def test_permanent_project_delete_requires_archived_owner_context(
    client,
    project,
    users,
):
    headers = _auth_header(users["owner"])

    active_delete = client.delete(f"/api/project/{project.uuid}", **headers)
    assert active_delete.status_code == 403
    assert Project.objects.filter(pk=project.pk).exists()

    project.is_archived = True
    project.save(update_fields=["is_archived"])
    archived_delete = client.delete(f"/api/project/{project.uuid}", **headers)

    assert archived_delete.status_code == 200
    assert not Project.objects.filter(pk=project.pk).exists()


@pytest.mark.django_db
def test_admin_account_role_bypasses_archived_resource_restriction(
    client,
    project,
    users,
):
    users["admin"].set_account_role(AccountRole.ADMIN)
    project.is_archived = True
    project.save(update_fields=["is_archived"])

    response = client.get(
        f"/api/project/{project.uuid}",
        **_auth_header(users["admin"]),
    )

    assert response.status_code == 200, response.content
    permissions = response.json()["item"]["permissions"]
    assert permissions["adminOverride"] is True
    assert permissions["accountRole"] == "admin"


@pytest.mark.django_db
def test_related_workflows_are_distinct_sorted_and_require_view_permission(
    client,
    project,
    users,
):
    parent = Workflow.objects.create(
        graph=Graph.objects.create(),
        project=project,
        author=users["owner"],
        title="Parent",
        workflow_type="course",
    )
    children = [
        Workflow.objects.create(
            graph=Graph.objects.create(),
            project=project,
            author=users["owner"],
            title=title,
            workflow_type="activity",
        )
        for title in ("Zulu child", "Alpha child")
    ]
    section = Section.objects.create(
        graph=parent.graph,
        title="Section",
        thread=Thread.objects.create(),
    )
    channel = Channel.objects.create(
        graph=parent.graph,
        title="Channel",
        thread=Thread.objects.create(),
    )
    for row, child in enumerate((*children, children[0])):
        Node.objects.create(
            section=section,
            channel=channel,
            workflow=parent,
            linked_workflow=child,
            thread=Thread.objects.create(),
            section_row=row,
            node_type="activity",
        )

    headers = _auth_header(users["viewer"])
    parent_response = client.get(f"/api/workflow/{parent.uuid}/related", **headers)
    child_response = client.get(
        f"/api/workflow/{children[0].uuid}/related",
        **headers,
    )
    denied = client.get(
        f"/api/workflow/{parent.uuid}/related",
        **_auth_header(users["outsider"]),
    )

    assert parent_response.status_code == 200, parent_response.content
    assert [row["title"] for row in parent_response.json()["contains"]] == [
        "Alpha child",
        "Zulu child",
    ]
    assert parent_response.json()["appearsIn"] == []
    assert [row["title"] for row in child_response.json()["appearsIn"]] == [
        "Parent"
    ]
    assert denied.status_code == 403
