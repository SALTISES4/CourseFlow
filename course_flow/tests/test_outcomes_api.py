from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.models import Authtoken, Graph, Outcome


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def user():
    user_model = get_user_model()
    return user_model.objects.create_user(
        email="outcomes-owner@example.com", password="password123"
    )


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


def _create_workflow(client: Client, raw_token: str) -> tuple[str, str]:
    response = client.post(
        "/api/workflow",
        data={
            "projectId": None,
            "title": "Outcomes WF",
            "workflowType": "course",
            "description": "",
        },
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200, response.content
    body = response.json()
    return body["uuid"], body["graphUuid"]


@pytest.mark.django_db
def test_create_and_list_outcomes_in_graph_view(client: Client, user):
    raw = _issue_token_for(user)
    workflow_uuid, graph_uuid = _create_workflow(client, raw)

    r = client.post(
        f"/api/graph/{graph_uuid}/outcomes",
        data={"title": "Root A", "code": "A"},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200, r.content
    body = r.json()
    assert body["meta"]["triggeredBy"] == "create_outcome"
    created = body["changes"]["outcomes"]["created"]
    assert len(created) == 1
    root_uuid = created[0]["uuid"]

    view = client.get(
        f"/api/graph/{workflow_uuid}/view",
        **_auth_header(raw),
    ).json()
    assert len(view["outcomes"]) == 1
    assert view["outcomes"][0]["uuid"] == root_uuid
    assert view["outcomes"][0]["title"] == "Root A"


@pytest.mark.django_db
def test_create_outcome_rejects_a_fourth_level(client: Client, user):
    raw = _issue_token_for(user)
    _workflow_uuid, graph_uuid = _create_workflow(client, raw)
    graph = Graph.objects.get(uuid=graph_uuid)
    root = Outcome.objects.create(graph=graph, title="Root", order=0)
    child = Outcome.objects.create(graph=graph, parent=root, title="Child", order=0)
    grandchild = Outcome.objects.create(
        graph=graph,
        parent=child,
        title="Grandchild",
        order=0,
    )

    response = client.post(
        f"/api/graph/{graph_uuid}/outcomes",
        data={"parentUuid": str(grandchild.uuid), "title": "Too deep"},
        content_type="application/json",
        **_auth_header(raw),
    )

    assert response.status_code == 400, response.content
    assert not Outcome.objects.filter(graph=graph, title="Too deep").exists()


@pytest.mark.django_db
def test_move_outcome_reparents_and_reorders(client: Client, user):
    raw = _issue_token_for(user)
    _workflow_uuid, graph_uuid = _create_workflow(client, raw)
    g = Graph.objects.get(uuid=graph_uuid)

    root = Outcome.objects.create(graph=g, title="Root", order=0)
    child_a = Outcome.objects.create(graph=g, parent=root, title="A", order=0)
    Outcome.objects.create(graph=g, parent=root, title="B", order=1)

    r = client.post(
        f"/api/outcome/{child_a.uuid}/move",
        data={"parentUuid": None, "insertIndex": 1},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert r.status_code == 200, r.content

    roots = list(
        Outcome.objects.filter(graph=g, parent__isnull=True).order_by("order", "id")
    )
    assert [o.title for o in roots] == ["Root", "A"]
    assert roots[0].order == 0
    assert roots[1].order == 1

    remaining_children = list(
        Outcome.objects.filter(graph=g, parent=root).order_by("order", "id")
    )
    assert [o.title for o in remaining_children] == ["B"]
    assert remaining_children[0].order == 0


@pytest.mark.django_db
def test_move_outcome_rejects_a_subtree_that_would_exceed_three_levels(
    client: Client,
    user,
):
    raw = _issue_token_for(user)
    _workflow_uuid, graph_uuid = _create_workflow(client, raw)
    graph = Graph.objects.get(uuid=graph_uuid)
    root = Outcome.objects.create(graph=graph, title="Root", order=0)
    child = Outcome.objects.create(graph=graph, parent=root, title="Child", order=0)
    moving = Outcome.objects.create(graph=graph, title="Moving", order=1)
    Outcome.objects.create(graph=graph, parent=moving, title="Descendant", order=0)

    response = client.post(
        f"/api/outcome/{moving.uuid}/move",
        data={"parentUuid": str(child.uuid)},
        content_type="application/json",
        **_auth_header(raw),
    )

    assert response.status_code == 400, response.content
    moving.refresh_from_db()
    assert moving.parent_id is None


@pytest.mark.django_db
def test_delete_outcome_cascades_children(client: Client, user):
    raw = _issue_token_for(user)
    _workflow_uuid, graph_uuid = _create_workflow(client, raw)
    g = Graph.objects.get(uuid=graph_uuid)

    root = Outcome.objects.create(graph=g, title="Root", order=0)
    child = Outcome.objects.create(graph=g, parent=root, title="Child", order=0)
    grandchild = Outcome.objects.create(
        graph=g,
        parent=child,
        title="Grandchild",
        order=0,
    )

    r = client.delete(
        f"/api/outcome/{root.uuid}",
        **_auth_header(raw),
    )
    assert r.status_code == 200
    assert set(r.json()["changes"]["outcomes"]["deleted"]) == {
        str(root.uuid),
        str(child.uuid),
        str(grandchild.uuid),
    }
    assert Outcome.objects.filter(graph=g).count() == 0
