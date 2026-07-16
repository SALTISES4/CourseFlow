from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.models import (
    Authtoken,
    Channel,
    FavoriteGraph,
    FavoriteProject,
    Graph,
    Node,
    Project,
    Section,
    Thread,
    Workflow,
)


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def owner():
    return get_user_model().objects.create_user(
        email="lifecycle-owner@example.com",
        password="password123",
    )


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


def _workflow(*, project: Project, owner, title: str) -> Workflow:
    return Workflow.objects.create(
        graph=Graph.objects.create(),
        project=project,
        author=owner,
        title=title,
        workflow_type="course",
    )


@pytest.mark.django_db
def test_project_archive_and_restore_apply_required_batch_side_effects(
    client: Client,
    owner,
):
    project = Project.objects.create(
        owner=owner,
        title="Lifecycle project",
        is_published=True,
    )
    workflow = _workflow(project=project, owner=owner, title="Child")
    FavoriteProject.objects.create(user=owner, project=project)
    FavoriteGraph.objects.create(user=owner, graph=workflow.graph)
    headers = _auth_header(owner)

    archived = client.post(f"/api/project/{project.uuid}/archive", **headers)

    assert archived.status_code == 200, archived.content
    project.refresh_from_db()
    workflow.refresh_from_db()
    assert project.is_archived is True
    assert project.is_published is False
    assert workflow.is_archived is True
    assert not FavoriteProject.objects.filter(project=project).exists()
    assert not FavoriteGraph.objects.filter(graph=workflow.graph).exists()
    assert client.get(f"/api/project/{project.uuid}", **headers).status_code == 403

    library = client.post(
        "/api/library/search",
        data={"filters": {"isArchived": True}},
        content_type="application/json",
        **headers,
    )
    assert library.status_code == 200, library.content
    project_row = next(
        row for row in library.json()["items"] if row["contentType"] == "project"
    )
    assert project_row["isArchived"] is True
    assert project_row["permissions"]["actions"] == [
        "delete_project",
        "restore_project",
    ]

    restored = client.post(f"/api/project/{project.uuid}/restore", **headers)

    assert restored.status_code == 200, restored.content
    project.refresh_from_db()
    workflow.refresh_from_db()
    assert project.is_archived is False
    assert workflow.is_archived is False
    assert client.get(f"/api/project/{project.uuid}", **headers).status_code == 200


@pytest.mark.django_db
def test_single_workflow_archive_breaks_links_and_requires_archive_before_delete(
    client: Client,
    owner,
):
    project = Project.objects.create(owner=owner, title="Workflow lifecycle")
    parent = _workflow(project=project, owner=owner, title="Parent")
    child = _workflow(project=project, owner=owner, title="Child")
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
    node = Node.objects.create(
        section=section,
        channel=channel,
        workflow=parent,
        linked_workflow=child,
        thread=Thread.objects.create(),
        section_row=0,
        node_type="activity",
    )
    FavoriteGraph.objects.create(user=owner, graph=child.graph)
    parent_revision = parent.graph.revision_id
    headers = _auth_header(owner)

    active_delete = client.delete(f"/api/workflow/{child.uuid}", **headers)
    assert active_delete.status_code == 403

    archived = client.post(f"/api/workflow/{child.uuid}/archive", **headers)

    assert archived.status_code == 200, archived.content
    child.refresh_from_db()
    node.refresh_from_db()
    parent.graph.refresh_from_db()
    assert child.is_archived is True
    assert node.linked_workflow_id is None
    assert parent.graph.revision_id == parent_revision + 1
    assert not FavoriteGraph.objects.filter(graph=child.graph).exists()
    assert client.get(f"/api/workflow/{child.uuid}", **headers).status_code == 403

    restored = client.post(f"/api/workflow/{child.uuid}/restore", **headers)
    assert restored.status_code == 200, restored.content
    child.refresh_from_db()
    assert child.is_archived is False

    client.post(f"/api/workflow/{child.uuid}/archive", **headers)
    deleted = client.delete(f"/api/workflow/{child.uuid}", **headers)
    assert deleted.status_code == 200, deleted.content
    assert not Workflow.objects.filter(pk=child.pk).exists()


@pytest.mark.django_db
def test_workflow_cannot_be_restored_independently_under_archived_project(
    client: Client,
    owner,
):
    project = Project.objects.create(owner=owner, title="Archived parent")
    workflow = _workflow(project=project, owner=owner, title="Child")
    headers = _auth_header(owner)
    client.post(f"/api/project/{project.uuid}/archive", **headers)

    response = client.post(f"/api/workflow/{workflow.uuid}/restore", **headers)

    assert response.status_code == 409
    workflow.refresh_from_db()
    assert workflow.is_archived is True
