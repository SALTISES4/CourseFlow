from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.enum import TeamRole, WorkflowType
from course_flow.core.models import (
    Authtoken,
    Channel,
    Graph,
    Outcome,
    Project,
    Section,
    TeamUser,
    Workflow,
)
from course_flow.tests.node_helpers import create_grid_node


def _user(email: str):
    return get_user_model().objects.create_user(
        email=email,
        password="password123",
    )


def _auth(user) -> dict[str, str]:
    raw = generate_raw_token()
    now = timezone.now()
    Authtoken.objects.create(
        user=user,
        token_hash=hash_token(raw),
        expires_at=now + timedelta(hours=1),
        last_used_at=now,
    )
    return {"HTTP_AUTHORIZATION": f"Bearer {raw}"}


def _workflow(owner, *, project: Project | None = None) -> Workflow:
    return Workflow.objects.create(
        graph=Graph.objects.create(),
        author=owner,
        project=project,
        title="Public-link workflow",
        description="Anonymous read-only content",
        workflow_type=WorkflowType.COURSE,
    )


@pytest.mark.django_db
def test_owner_and_project_editor_can_enable_and_revoke_public_link():
    owner = _user("public-link-owner@example.com")
    editor = _user("public-link-editor@example.com")
    project = Project.objects.create(
        owner=owner,
        title="Private parent",
        is_published=False,
    )
    TeamUser.objects.create(
        team=project.team,
        user=editor,
        role=TeamRole.EDITOR,
    )
    workflow = _workflow(owner, project=project)
    client = Client()

    enabled = client.patch(
        f"/api/workflow/{workflow.uuid}/public-link",
        data={"enabled": True},
        content_type="application/json",
        **_auth(owner),
    )

    assert enabled.status_code == 200, enabled.content
    assert enabled.json()["item"]["publicLinkEnabled"] is True
    workflow.refresh_from_db()
    project.refresh_from_db()
    assert workflow.public_link_enabled is True
    assert project.is_published is False

    revoked = client.patch(
        f"/api/workflow/{workflow.uuid}/public-link",
        data={"enabled": False},
        content_type="application/json",
        **_auth(editor),
    )

    assert revoked.status_code == 200, revoked.content
    assert revoked.json()["item"]["publicLinkEnabled"] is False
    workflow.refresh_from_db()
    assert workflow.public_link_enabled is False


@pytest.mark.django_db
@pytest.mark.parametrize("role", [TeamRole.COMMENTER, TeamRole.VIEWER])
def test_commenter_and_viewer_cannot_change_public_link(role: TeamRole):
    owner = _user(f"public-link-owner-{role}@example.com")
    contributor = _user(f"public-link-{role}@example.com")
    project = Project.objects.create(owner=owner, title="Private parent")
    TeamUser.objects.create(team=project.team, user=contributor, role=role)
    workflow = _workflow(owner, project=project)

    response = Client().patch(
        f"/api/workflow/{workflow.uuid}/public-link",
        data={"enabled": True},
        content_type="application/json",
        **_auth(contributor),
    )

    assert response.status_code == 403
    workflow.refresh_from_db()
    assert workflow.public_link_enabled is False


@pytest.mark.django_db
def test_non_contributor_cannot_change_public_link():
    owner = _user("public-link-owner-outsider@example.com")
    outsider = _user("public-link-outsider@example.com")
    project = Project.objects.create(
        owner=owner,
        title="Published parent",
        is_published=True,
    )
    workflow = _workflow(owner, project=project)

    response = Client().patch(
        f"/api/workflow/{workflow.uuid}/public-link",
        data={"enabled": True},
        content_type="application/json",
        **_auth(outsider),
    )

    assert response.status_code == 403
    workflow.refresh_from_db()
    assert workflow.public_link_enabled is False


@pytest.mark.django_db
def test_public_detail_and_graph_are_anonymous_read_only_projections():
    owner = _user("public-link-projection-owner@example.com")
    project = Project.objects.create(
        owner=owner,
        title="Unpublished parent",
        is_published=False,
    )
    workflow = _workflow(owner, project=project)
    workflow.public_link_enabled = True
    workflow.save(update_fields=["public_link_enabled"])
    linked_workflow = _workflow(owner, project=project)
    section = Section.objects.create(
        graph=workflow.graph, title="Public section", position=0
    )
    channel = Channel.objects.create(
        graph=workflow.graph, title="Public channel", position=0
    )
    create_grid_node(
        section=section,
        channel=channel,
        workflow=workflow,
        linked_workflow=linked_workflow,
        section_row=0,
        title="Public node",
    )
    Outcome.objects.create(graph=workflow.graph, title="Public outcome", order=0)
    client = Client()

    detail = client.get(f"/api/public/workflow/{workflow.uuid}")
    graph = client.get(f"/api/public/graph/{workflow.uuid}/view")

    assert detail.status_code == 200, detail.content
    item = detail.json()["item"]
    assert item["uuid"] == str(workflow.uuid)
    assert item["title"] == "Public-link workflow"
    assert item["description"] == "Anonymous read-only content"
    assert item["permissions"] == {
        "accountRole": None,
        "resourceRole": "public",
        "state": "public-link",
        "actions": ["view"],
        "adminOverride": False,
    }
    assert "owner" not in item
    assert "projectUuid" not in item

    assert graph.status_code == 200, graph.content
    graph_body = graph.json()
    assert graph_body["permissions"] == item["permissions"]
    assert graph_body["projectPermissions"] is None
    assert graph_body["graph"]["authorId"] is None
    assert graph_body["graph"]["workflowProjectId"] is None
    assert all(item["threadUuid"] is None for item in graph_body["sections"])
    assert all(item["threadUuid"] is None for item in graph_body["channels"])
    assert all(item["threadUuid"] is None for item in graph_body["nodes"])
    assert all(item["linkedWorkflowUuid"] is None for item in graph_body["nodes"])
    assert all(item["threadUuid"] is None for item in graph_body["outcomes"])
    assert graph_body["threadCommentCounts"] == []

    authenticated_update = client.patch(
        f"/api/workflow/{workflow.uuid}",
        data={"title": "Anonymous mutation"},
        content_type="application/json",
    )
    assert authenticated_update.status_code == 401
    workflow.refresh_from_db()
    assert workflow.title == "Public-link workflow"


@pytest.mark.django_db
def test_public_access_is_workflow_specific_and_revocation_is_immediate():
    owner = _user("public-link-specific-owner@example.com")
    project = Project.objects.create(owner=owner, title="Unpublished parent")
    public_workflow = _workflow(owner, project=project)
    private_workflow = _workflow(owner, project=project)
    public_workflow.public_link_enabled = True
    public_workflow.save(update_fields=["public_link_enabled"])
    client = Client()

    assert client.get(f"/api/public/workflow/{public_workflow.uuid}").status_code == 200
    assert (
        client.get(f"/api/public/workflow/{private_workflow.uuid}").status_code == 404
    )

    revoked = client.patch(
        f"/api/workflow/{public_workflow.uuid}/public-link",
        data={"enabled": False},
        content_type="application/json",
        **_auth(owner),
    )
    assert revoked.status_code == 200, revoked.content
    assert client.get(f"/api/public/workflow/{public_workflow.uuid}").status_code == 404
    assert (
        client.get(f"/api/public/graph/{public_workflow.uuid}/view").status_code == 404
    )


@pytest.mark.django_db
@pytest.mark.parametrize("archive_parent", [False, True])
def test_archived_workflow_or_parent_is_not_publicly_available(archive_parent: bool):
    owner = _user(f"public-link-archive-{archive_parent}@example.com")
    project = Project.objects.create(
        owner=owner,
        title="Parent",
        is_archived=archive_parent,
    )
    workflow = _workflow(owner, project=project)
    workflow.public_link_enabled = True
    workflow.is_archived = not archive_parent
    workflow.save(update_fields=["public_link_enabled", "is_archived"])
    client = Client()

    assert client.get(f"/api/public/workflow/{workflow.uuid}").status_code == 404
    assert client.get(f"/api/public/graph/{workflow.uuid}/view").status_code == 404
