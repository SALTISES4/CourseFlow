from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.enum import Role, WorkflowType
from course_flow.core.models import (
    Authtoken,
    Discipline,
    Graph,
    Project,
    Team,
    Workflow,
)
from course_flow.core.models.relations import (
    FavoriteGraph,
    FavoriteProject,
    ProjectDiscipline,
    TeamUser,
)


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def user():
    return get_user_model().objects.create_user(
        email="library-owner@example.com",
        password="password123",
    )


@pytest.fixture
def teammate():
    return get_user_model().objects.create_user(
        email="library-teammate@example.com",
        password="password123",
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


def _post_search(client: Client, raw_token: str, payload: dict, *, status_code: int = 200):
    response = client.post(
        "/api/library/search",
        data=payload,
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == status_code, response.content
    return response.json()


def _post_favorite(client: Client, raw_token: str, payload: dict, *, status_code: int = 200):
    response = client.post(
        "/api/library/favorite",
        data=payload,
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == status_code, response.content
    return response.json()


def _graph_with_workflow(
    owner,
    *,
    project: Project | None,
    workflow_title: str,
    workflow_description: str = "",
    workflow_type: str = WorkflowType.COURSE,
) -> Graph:
    graph = Graph.objects.create()
    Workflow.objects.create(
        graph=graph,
        author=owner,
        project=project,
        title=workflow_title,
        description=workflow_description,
        workflow_type=workflow_type,
    )
    return graph


@pytest.mark.django_db
def test_search_no_filters_returns_project_and_workflow_items(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="Project", description="Project description")
    graph = _graph_with_workflow(
        user,
        project=project,
        workflow_title="Workflow",
        workflow_description="Workflow description",
        workflow_type=WorkflowType.COURSE,
    )

    body = _post_search(client, raw, {})
    assert body["meta"]["totalResults"] == 2
    assert {item["contentType"] for item in body["items"]} == {"project", "workflow"}
    assert all(item["uuid"] for item in body["items"])

    project_item = next(item for item in body["items"] if item["contentType"] == "project")
    workflow_item = next(item for item in body["items"] if item["contentType"] == "workflow")
    assert project_item["uuid"] == str(project.uuid)
    assert project_item["label"] == "project"
    assert workflow_item["uuid"] == str(graph.workflow.uuid)
    assert workflow_item["label"] == WorkflowType.COURSE

    expected_keys = {
        "uuid",
        "contentType",
        "label",
        "title",
        "description",
        "dateCreated",
        "modifiedOn",
        "isTemplate",
        "isFavorite",
    }
    for item in body["items"]:
        assert set(item.keys()) == expected_keys
        assert "graphUuid" not in item
        assert "projectUuid" not in item
        assert "workflowUuid" not in item
        assert "objectType" not in item


@pytest.mark.django_db
def test_filter_content_type_project_returns_only_projects(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P", description="")
    _graph_with_workflow(user, project=project, workflow_title="W", workflow_type=WorkflowType.TASK)

    body = _post_search(client, raw, {"filters": {"contentType": "project"}})
    assert body["meta"]["totalResults"] == 1
    assert {item["contentType"] for item in body["items"]} == {"project"}


@pytest.mark.django_db
def test_filter_content_type_workflow_returns_only_workflows(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P", description="")
    _graph_with_workflow(user, project=project, workflow_title="W", workflow_type=WorkflowType.TASK)

    body = _post_search(client, raw, {"filters": {"contentType": "workflow"}})
    assert body["meta"]["totalResults"] == 1
    assert {item["contentType"] for item in body["items"]} == {"workflow"}


@pytest.mark.django_db
def test_filter_workflow_types_returns_matching_workflow_items_only(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P", description="")
    _graph_with_workflow(user, project=project, workflow_title="Course", workflow_type=WorkflowType.COURSE)
    _graph_with_workflow(user, project=project, workflow_title="Task", workflow_type=WorkflowType.TASK)

    body = _post_search(client, raw, {"filters": {"workflowTypes": ["course"]}})
    assert body["meta"]["totalResults"] == 1
    assert {item["contentType"] for item in body["items"]} == {"workflow"}
    assert body["items"][0]["label"] == WorkflowType.COURSE


@pytest.mark.django_db
def test_filter_discipline_ids_applies_to_projects_and_workflows(client: Client, user):
    raw = _issue_token_for(user)
    d_match = Discipline.objects.create(label="Match", translation_plural="Matches")
    d_other = Discipline.objects.create(label="Other", translation_plural="Others")

    p_match = Project.objects.create(owner=user, title="Keep", description="")
    ProjectDiscipline.objects.create(project=p_match, discipline=d_match)
    _graph_with_workflow(user, project=p_match, workflow_title="Keep wf", workflow_type=WorkflowType.COURSE)

    p_drop = Project.objects.create(owner=user, title="Drop", description="")
    ProjectDiscipline.objects.create(project=p_drop, discipline=d_other)
    _graph_with_workflow(user, project=p_drop, workflow_title="Drop wf", workflow_type=WorkflowType.COURSE)

    body = _post_search(client, raw, {"filters": {"disciplineIds": [d_match.id]}})
    assert body["meta"]["totalResults"] == 2
    assert {item["title"] for item in body["items"]} == {"Keep", "Keep wf"}


@pytest.mark.django_db
def test_filter_is_favorite_true_returns_only_favorited_rows(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="Project", description="")
    graph = _graph_with_workflow(user, project=project, workflow_title="Workflow", workflow_type=WorkflowType.COURSE)
    Project.objects.create(owner=user, title="Other", description="")
    _graph_with_workflow(user, project=project, workflow_title="Other workflow", workflow_type=WorkflowType.TASK)

    FavoriteProject.objects.create(user=user, project=project)
    FavoriteGraph.objects.create(user=user, graph=graph)

    body = _post_search(client, raw, {"filters": {"isFavorite": True}})
    assert body["meta"]["totalResults"] == 2
    assert {item["title"] for item in body["items"]} == {"Project", "Workflow"}


@pytest.mark.django_db
def test_response_meta_includes_applied_filters_and_allowed_disciplines(client: Client, user):
    raw = _issue_token_for(user)
    d1 = Discipline.objects.create(label="Biology", translation_plural="Biologies")
    d2 = Discipline.objects.create(label="Astronomy", translation_plural="Astronomies")
    project = Project.objects.create(owner=user, title="Project", description="", is_template=True)
    _graph_with_workflow(user, project=project, workflow_title="Workflow", workflow_type=WorkflowType.COURSE)

    body = _post_search(
        client,
        raw,
        {
            "pagination": {"page": 0, "resultsPerPage": 1},
            "filters": {
                "keyword": " ",
                "contentType": "workflow",
                "disciplineIds": [],
                "workflowTypes": ["course"],
                "isTemplate": True,
            },
        },
    )

    meta = body["meta"]
    assert {"totalResults", "pageCount", "currentPage", "resultsPerPage", "appliedFilters", "allowed"} <= set(meta.keys())
    assert meta["appliedFilters"]["keyword"] is None
    assert meta["appliedFilters"]["contentType"] == "workflow"
    assert meta["appliedFilters"]["workflowTypes"] == ["course"]
    assert meta["appliedFilters"]["disciplineIds"] == []
    assert meta["appliedFilters"]["isTemplate"] is True

    allowed_disciplines = meta["allowed"]["disciplines"]
    assert [d["label"] for d in allowed_disciplines] == ["Astronomy", "Biology"]
    assert {d["id"] for d in allowed_disciplines} == {d1.id, d2.id}
    assert {d["translationPlural"] for d in allowed_disciplines} == {"Astronomies", "Biologies"}


@pytest.mark.django_db
def test_filter_ownership_owned_and_shared(client: Client, user, teammate):
    raw = _issue_token_for(user)
    owned = Project.objects.create(owner=user, title="Owned", description="")
    shared = Project.objects.create(owner=teammate, title="Shared", description="")
    team = Team.objects.get(project=shared)
    TeamUser.objects.create(team=team, user=user, role=Role.VIEWER)
    _graph_with_workflow(user, project=owned, workflow_title="Owned wf", workflow_type=WorkflowType.COURSE)
    _graph_with_workflow(teammate, project=shared, workflow_title="Shared wf", workflow_type=WorkflowType.COURSE)

    owned_body = _post_search(client, raw, {"filters": {"ownership": "owned"}})
    assert {item["title"] for item in owned_body["items"]} == {"Owned", "Owned wf"}

    shared_body = _post_search(client, raw, {"filters": {"ownership": "shared"}})
    assert {item["title"] for item in shared_body["items"]} == {"Shared", "Shared wf"}


@pytest.mark.django_db
def test_old_dynamic_filter_list_shape_not_supported(client: Client, user):
    raw = _issue_token_for(user)
    _post_search(
        client,
        raw,
        {"filters": [{"name": "workspaceType", "value": "project"}]},
        status_code=422,
    )


@pytest.mark.django_db
def test_invalid_enum_values_fail_validation(client: Client, user):
    raw = _issue_token_for(user)
    _post_search(client, raw, {"filters": {"contentType": "graph"}}, status_code=422)
    _post_search(client, raw, {"filters": {"workflowTypes": ["invalid"]}}, status_code=422)


@pytest.mark.django_db
def test_contradictory_project_content_type_and_workflow_types_fails_validation(
    client: Client, user
):
    raw = _issue_token_for(user)
    _post_search(
        client,
        raw,
        {"filters": {"contentType": "project", "workflowTypes": ["course"]}},
        status_code=422,
    )


@pytest.mark.django_db
def test_workflow_favorite_toggle_resolves_by_workflow_uuid_to_favorite_graph(
    client: Client, user
):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="Project", description="")
    graph = _graph_with_workflow(
        user,
        project=project,
        workflow_title="Workflow",
        workflow_type=WorkflowType.COURSE,
    )
    workflow_uuid = graph.workflow.uuid

    before = _post_search(client, raw, {})
    workflow_row_before = next(
        item for item in before["items"] if item["contentType"] == "workflow"
    )
    assert workflow_row_before["uuid"] == str(workflow_uuid)
    assert workflow_row_before["isFavorite"] is False

    favorite_body = _post_favorite(client, raw, {"uuid": str(workflow_uuid)})
    assert favorite_body["uuid"] == str(workflow_uuid)
    assert favorite_body["message"] == "added"

    favorite_link = FavoriteGraph.objects.get(user=user)
    assert favorite_link.graph_id == graph.id

    after = _post_search(client, raw, {})
    workflow_row_after = next(
        item for item in after["items"] if item["contentType"] == "workflow"
    )
    assert workflow_row_after["uuid"] == str(workflow_uuid)
    assert workflow_row_after["isFavorite"] is True


@pytest.mark.django_db
def test_project_favorite_toggle_creates_favorite_project_and_marks_search(
    client: Client, user
):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="Project", description="")
    _graph_with_workflow(
        user,
        project=project,
        workflow_title="Workflow",
        workflow_type=WorkflowType.COURSE,
    )

    favorite_body = _post_favorite(client, raw, {"uuid": str(project.uuid)})
    assert favorite_body["uuid"] == str(project.uuid)
    assert favorite_body["message"] == "added"
    assert FavoriteProject.objects.filter(user=user, project=project).exists()

    after = _post_search(client, raw, {"filters": {"contentType": "project"}})
    project_row_after = after["items"][0]
    assert project_row_after["uuid"] == str(project.uuid)
    assert project_row_after["isFavorite"] is True
