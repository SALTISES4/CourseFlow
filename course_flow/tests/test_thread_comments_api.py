from __future__ import annotations

from datetime import timedelta
from uuid import uuid4

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.enum import WorkflowType
from course_flow.core.models import (
    Authtoken,
    Comment,
    Graph,
    Section,
    Thread,
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
    Authtoken.objects.create(
        user=user,
        token_hash=hash_token(raw_token),
        expires_at=now + expires_delta,
        last_used_at=now,
    )
    return raw_token


def _graph_with_section_thread(user):
    g = Graph.objects.create()
    Workflow.objects.create(
        graph=g,
        author=user,
        title="",
        description="",
        workflow_type=WorkflowType.COURSE,
    )
    thread = Thread.objects.create()
    Section.objects.create(graph=g, title="S1", position=0, thread=thread)
    Comment.objects.create(thread=thread, author=user, body="First comment")
    return g, thread


@pytest.mark.django_db
def test_list_thread_comments_returns_flat_comment_rows(client: Client, user):
    raw_token = _issue_token_for(user)
    _, thread = _graph_with_section_thread(user)

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
    _, thread = _graph_with_section_thread(user)
    response = client.get(f"/api/thread/{thread.uuid}/comments")
    assert response.status_code == 401


@pytest.mark.django_db
def test_list_thread_comments_forbidden_for_non_owner(client: Client, user, other_user):
    raw_other = _issue_token_for(other_user)
    _, thread = _graph_with_section_thread(user)

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
def test_orphan_thread_without_graph_context_returns_404(client: Client, user):
    raw_token = _issue_token_for(user)
    orphan = Thread.objects.create()
    response = client.get(
        f"/api/thread/{orphan.uuid}/comments",
        **_auth_header(raw_token),
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_create_thread_comment_and_list_includes_it(client: Client, user):
    raw_token = _issue_token_for(user)
    _, thread = _graph_with_section_thread(user)

    create = client.post(
        f"/api/thread/{thread.uuid}/comments",
        data={"body": "New remark"},
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert create.status_code == 200, create.content
    created = create.json()
    assert created["body"] == "New remark"
    assert created["threadUuid"] == str(thread.uuid)

    listed = client.get(
        f"/api/thread/{thread.uuid}/comments",
        **_auth_header(raw_token),
    )
    assert listed.status_code == 200
    bodies = [row["body"] for row in listed.json()]
    assert "First comment" in bodies
    assert "New remark" in bodies


@pytest.mark.django_db
def test_delete_one_thread_comment(client: Client, user):
    raw_token = _issue_token_for(user)
    _, thread = _graph_with_section_thread(user)
    listed = client.get(
        f"/api/thread/{thread.uuid}/comments",
        **_auth_header(raw_token),
    )
    comment_uuid = listed.json()[0]["uuid"]

    deleted = client.delete(
        f"/api/thread/{thread.uuid}/comments/{comment_uuid}",
        **_auth_header(raw_token),
    )
    assert deleted.status_code == 200
    assert deleted.json() == {"success": True}

    listed_after = client.get(
        f"/api/thread/{thread.uuid}/comments",
        **_auth_header(raw_token),
    )
    assert listed_after.json() == []


@pytest.mark.django_db
def test_owner_cannot_delete_another_users_comment(
    client: Client,
    user,
    other_user,
):
    raw_token = _issue_token_for(user)
    _, thread = _graph_with_section_thread(user)
    comment = Comment.objects.create(
        thread=thread,
        author=other_user,
        body="Not the owner's comment",
    )

    deleted = client.delete(
        f"/api/thread/{thread.uuid}/comments/{comment.uuid}",
        **_auth_header(raw_token),
    )

    assert deleted.status_code == 403
    assert Comment.objects.filter(pk=comment.pk).exists()


@pytest.mark.django_db
def test_delete_all_thread_comments_deletes_only_current_users_comments(
    client: Client,
    user,
    other_user,
):
    raw_token = _issue_token_for(user)
    _, thread = _graph_with_section_thread(user)
    other_comment = Comment.objects.create(
        thread=thread,
        author=other_user,
        body="Another user's comment",
    )
    client.post(
        f"/api/thread/{thread.uuid}/comments",
        data={"body": "Second"},
        content_type="application/json",
        **_auth_header(raw_token),
    )

    deleted = client.delete(
        f"/api/thread/{thread.uuid}/comments",
        **_auth_header(raw_token),
    )
    assert deleted.status_code == 200
    body = deleted.json()
    assert body["success"] is True
    assert body["deletedCount"] == 2
    assert Comment.objects.filter(pk=other_comment.pk).exists()

    listed = client.get(
        f"/api/thread/{thread.uuid}/comments",
        **_auth_header(raw_token),
    )
    assert [row["uuid"] for row in listed.json()] == [str(other_comment.uuid)]


@pytest.mark.django_db
def test_delete_comment_fails_when_comment_belongs_to_other_thread(
    client: Client, user
):
    raw_token = _issue_token_for(user)
    _, thread_a = _graph_with_section_thread(user)
    _, thread_b = _graph_with_section_thread(user)

    listed_b = client.get(
        f"/api/thread/{thread_b.uuid}/comments",
        **_auth_header(raw_token),
    )
    comment_on_b = listed_b.json()[0]["uuid"]

    response = client.delete(
        f"/api/thread/{thread_a.uuid}/comments/{comment_on_b}",
        **_auth_header(raw_token),
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_create_thread_comment_rejects_empty_body(client: Client, user):
    raw_token = _issue_token_for(user)
    _, thread = _graph_with_section_thread(user)
    response = client.post(
        f"/api/thread/{thread.uuid}/comments",
        data={"body": "   "},
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 400
