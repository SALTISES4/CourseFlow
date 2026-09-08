from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.enum import TeamRole
from course_flow.core.models import (
    Authtoken,
    Project,
    TeamUser,
    WorkspaceEditLock,
)


def _headers(user) -> dict[str, str]:
    now = timezone.now()
    raw = generate_raw_token()
    Authtoken.objects.create(
        user=user,
        token_hash=hash_token(raw),
        expires_at=now + timedelta(hours=1),
        last_used_at=now,
    )
    return {"HTTP_AUTHORIZATION": f"Bearer {raw}"}


@pytest.fixture
def lock_context():
    user_model = get_user_model()
    owner = user_model.objects.create_user(
        email="lock-owner@example.com",
        password="password123",
        first_name="Alex",
        last_name="Smith",
    )
    editor = user_model.objects.create_user(
        email="lock-editor@example.com",
        password="password123",
        first_name="Blair",
        last_name="Jones",
    )
    viewer = user_model.objects.create_user(
        email="lock-viewer@example.com",
        password="password123",
    )
    project = Project.objects.create(owner=owner, title="Locked project")
    TeamUser.objects.create(team=project.team, user=editor, role=TeamRole.EDITOR)
    TeamUser.objects.create(team=project.team, user=viewer, role=TeamRole.VIEWER)
    return {
        "project": project,
        "owner": owner,
        "editor": editor,
        "viewer": viewer,
        "owner_headers": _headers(owner),
        "editor_headers": _headers(editor),
        "viewer_headers": _headers(viewer),
    }


def _acquire(client: Client, project: Project, headers: dict[str, str]):
    return client.post(
        f"/api/workspace-lock/project/{project.uuid}/acquire",
        content_type="application/json",
        **headers,
    )


@pytest.mark.django_db
def test_acquire_refresh_and_takeover_are_single_holder_operations(lock_context):
    client = Client()
    project = lock_context["project"]

    acquired = _acquire(client, project, lock_context["owner_headers"])
    assert acquired.status_code == 200, acquired.content
    assert acquired.json()["state"] == "held"
    original_version = acquired.json()["version"]

    blocked = _acquire(client, project, lock_context["editor_headers"])
    assert blocked.status_code == 200, blocked.content
    assert blocked.json()["state"] == "locked"
    assert blocked.json()["holder"]["displayName"] == "Alex Smith"
    assert blocked.json()["version"] == original_version

    taken = client.post(
        f"/api/workspace-lock/project/{project.uuid}/takeover",
        data={"expectedVersion": original_version},
        content_type="application/json",
        **lock_context["editor_headers"],
    )
    assert taken.status_code == 200, taken.content
    assert taken.json()["state"] == "held"
    assert taken.json()["holder"]["displayName"] == "Blair Jones"
    assert taken.json()["version"] != original_version

    prior_holder_refresh = client.post(
        f"/api/workspace-lock/project/{project.uuid}/refresh",
        content_type="application/json",
        **lock_context["owner_headers"],
    )
    assert prior_holder_refresh.status_code == 200
    assert prior_holder_refresh.json()["state"] == "locked"
    assert prior_holder_refresh.json()["holder"]["displayName"] == "Blair Jones"

    stale_takeover = client.post(
        f"/api/workspace-lock/project/{project.uuid}/takeover",
        data={"expectedVersion": original_version},
        content_type="application/json",
        **lock_context["owner_headers"],
    )
    assert stale_takeover.status_code == 200
    assert stale_takeover.json()["state"] == "locked"
    assert stale_takeover.json()["holder"]["displayName"] == "Blair Jones"


@pytest.mark.django_db
def test_mutation_requires_current_unexpired_lock_and_never_partially_persists(
    lock_context,
):
    client = Client()
    project = lock_context["project"]

    missing = client.patch(
        f"/api/project/{project.uuid}",
        data={"title": "Must not persist"},
        content_type="application/json",
        **lock_context["owner_headers"],
    )
    assert missing.status_code == 409, missing.content
    assert missing.json()["code"] == "edit_lock_expired"
    project.refresh_from_db()
    assert project.title == "Locked project"

    acquired = _acquire(client, project, lock_context["owner_headers"])
    assert acquired.status_code == 200
    allowed = client.patch(
        f"/api/project/{project.uuid}",
        data={"title": "Owner persisted"},
        content_type="application/json",
        **lock_context["owner_headers"],
    )
    assert allowed.status_code == 200, allowed.content

    conflict = client.patch(
        f"/api/project/{project.uuid}",
        data={"title": "Editor must not persist"},
        content_type="application/json",
        **lock_context["editor_headers"],
    )
    assert conflict.status_code == 409, conflict.content
    assert conflict.json() == {
        "code": "workspace_edit_lock_conflict",
        "params": {
            "workspace": "project",
            "resourceUuid": str(project.uuid),
            "holderDisplayName": "Alex Smith",
            "holderUuid": str(lock_context["owner"].uuid),
            "version": acquired.json()["version"],
        },
    }
    project.refresh_from_db()
    assert project.title == "Owner persisted"

    lock = WorkspaceEditLock.objects.get(project=project)
    lock.expires_at = timezone.now() - timedelta(seconds=1)
    lock.save(update_fields=["expires_at"])
    expired = client.patch(
        f"/api/project/{project.uuid}",
        data={"title": "Expired must not persist"},
        content_type="application/json",
        **lock_context["owner_headers"],
    )
    assert expired.status_code == 409
    assert expired.json()["code"] == "edit_lock_expired"
    project.refresh_from_db()
    assert project.title == "Owner persisted"


@pytest.mark.django_db
def test_viewer_does_not_participate_and_expired_lock_can_be_reacquired(lock_context):
    client = Client()
    project = lock_context["project"]

    viewer_attempt = _acquire(client, project, lock_context["viewer_headers"])
    assert viewer_attempt.status_code == 403
    assert not WorkspaceEditLock.objects.exists()

    acquired = _acquire(client, project, lock_context["owner_headers"])
    assert acquired.status_code == 200
    lock = WorkspaceEditLock.objects.get(project=project)
    lock.expires_at = timezone.now() - timedelta(seconds=1)
    lock.save(update_fields=["expires_at"])

    reacquired = _acquire(client, project, lock_context["editor_headers"])
    assert reacquired.status_code == 200
    assert reacquired.json()["state"] == "held"
    assert reacquired.json()["holder"]["displayName"] == "Blair Jones"
    assert reacquired.json()["version"] != acquired.json()["version"]


@pytest.mark.django_db
def test_project_and_child_workflow_locks_are_independent(lock_context):
    client = Client()
    project = lock_context["project"]

    project_lock = _acquire(client, project, lock_context["owner_headers"])
    assert project_lock.status_code == 200
    workflow_create = client.post(
        "/api/workflow",
        data={
            "projectUuid": str(project.uuid),
            "title": "Child workflow",
            "workflowType": "course",
        },
        content_type="application/json",
        **lock_context["owner_headers"],
    )
    assert workflow_create.status_code == 200, workflow_create.content
    workflow_uuid = workflow_create.json()["uuid"]

    workflow_lock = client.post(
        f"/api/workspace-lock/workflow/{workflow_uuid}/acquire",
        content_type="application/json",
        **lock_context["editor_headers"],
    )
    assert workflow_lock.status_code == 200, workflow_lock.content
    assert workflow_lock.json()["state"] == "held"

    project_status = client.get(
        f"/api/workspace-lock/project/{project.uuid}",
        **lock_context["owner_headers"],
    )
    assert project_status.json()["state"] == "held"
    assert WorkspaceEditLock.objects.filter(project=project).exists()
    assert WorkspaceEditLock.objects.filter(workflow__uuid=workflow_uuid).exists()
