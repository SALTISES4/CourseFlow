from __future__ import annotations

from datetime import timedelta
from uuid import uuid4

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow_v2.core.auth import generate_raw_token, hash_token
from course_flow_v2.core.models import (
    AuthToken,
    Comment,
    Section,
    Thread,
    Unit,
    Workflow,
)


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def user():
    user_model = get_user_model()
    return user_model.objects.create_user(email="thread-owner@example.com", password="password123")


@pytest.fixture
def other_user():
    user_model = get_user_model()
    return user_model.objects.create_user(email="thread-other@example.com", password="password123")


def _auth_header(raw_token: str) -> dict[str, str]:
    return {"HTTP_AUTHORIZATION": f"Bearer {raw_token}"}


def _issue_token_for(user, *, expires_delta: timedelta = timedelta(hours=1)):
    now = timezone.now()
    raw_token = generate_raw_token()
    AuthToken.objects.create(
        user=user,
        token_hash=hash_token(raw_token),
        expires_at=now + expires_delta,
        last_used_at=now,
    )
    return raw_token


def _workflow_with_section_thread(user):
    wf = Workflow.objects.create(owner=user, title="WF", project_id=None)
    Unit.objects.create(
        workflow=wf,
        title="",
        description="",
        unit_type=Unit.UnitType.COURSE,
    )
    thread = Thread.objects.create()
    Section.objects.create(workflow=wf, title="S1", position=0, thread=thread)
    Comment.objects.create(thread=thread, owner=user, body="First comment")
    return wf, thread


@pytest.mark.django_db
def test_list_thread_comments_returns_flat_comment_rows(client: Client, user):
    raw_token = _issue_token_for(user)
    _, thread = _workflow_with_section_thread(user)

    response = client.get(
        f"/api/thread/{thread.uuid}/comments",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    row = data[0]
    assert row["body"] == "First comment"
    assert row["threadUuid"] == str(thread.uuid)
    assert "uuid" in row
    assert "dateCreated" in row
    assert "modifiedOn" in row
    author = row["author"]
    assert author["uuid"] == str(user.uuid)
    assert author["email"] == user.email
    assert "firstName" in author
    assert "lastName" in author


@pytest.mark.django_db
def test_list_thread_comments_requires_auth(client: Client, user):
    _, thread = _workflow_with_section_thread(user)
    response = client.get(f"/api/thread/{thread.uuid}/comments")
    assert response.status_code == 401


@pytest.mark.django_db
def test_list_thread_comments_forbidden_for_non_owner(client: Client, user, other_user):
    raw_other = _issue_token_for(other_user)
    _, thread = _workflow_with_section_thread(user)

    response = client.get(
        f"/api/thread/{thread.uuid}/comments",
        **_auth_header(raw_other),
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_list_thread_comments_unknown_thread(client: Client, user):
    raw_token = _issue_token_for(user)
    response = client.get(
        f"/api/thread/{uuid4()}/comments",
        **_auth_header(raw_token),
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_orphan_thread_without_workflow_context_returns_404(client: Client, user):
    raw_token = _issue_token_for(user)
    orphan = Thread.objects.create()
    response = client.get(
        f"/api/thread/{orphan.uuid}/comments",
        **_auth_header(raw_token),
    )
    assert response.status_code == 404
