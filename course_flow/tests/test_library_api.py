from __future__ import annotations

from datetime import datetime, timedelta
from uuid import uuid4

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


@pytest.fixture
def stranger():
    return get_user_model().objects.create_user(
        email="library-stranger@example.com",
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


def _post_search(client: Client, raw_token: str, payload: dict) -> dict:
    response = client.post(
        "/api/library/search",
        data=payload,
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200, response.content
    return response.json()


def _graph_with_workflow(
    owner,
    *,
    project: Project | None,
    workflow_title: str,
    workflow_description: str = "",
    workflow_type: str = WorkflowType.COURSE,
) -> Graph:
    g = Graph.objects.create()
    Workflow.objects.create(
        graph=g,
        author=owner,
        project=project,
        title=workflow_title,
        description=workflow_description,
        workflow_type=workflow_type,
    )
    return g


def _set_project_created(project: Project, dt) -> None:
    Project.objects.filter(pk=project.pk).update(date_created=dt)


# --- access -----------------------------------------------------------------


@pytest.mark.django_db
def test_library_search_requires_auth(client: Client):
    response = client.post(
        "/api/library/search",
        data={},
        content_type="application/json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_stranger_sees_no_items_for_others_project(client: Client, user, stranger):
    project = Project.objects.create(owner=user, title="Secret", description="")
    _graph_with_workflow(
        user,
        project=project,
        workflow_title="Hidden Workflow",
        workflow_description="",
        workflow_type=WorkflowType.TASK,
    )
    raw_stranger = _issue_token_for(stranger)
    body = _post_search(client, raw_stranger, {})
    assert body["meta"]["totalResults"] == 0
    assert body["items"] == []


@pytest.mark.django_db
def test_owner_sees_own_project_and_child_workflow_backed_items(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="My Project", description="d")
    wf_course = _graph_with_workflow(
        user,
        project=project,
        workflow_title="Course A",
        workflow_description="",
        workflow_type=WorkflowType.COURSE,
    )
    wf_task = _graph_with_workflow(
        user,
        project=project,
        workflow_title="Task B",
        workflow_description="",
        workflow_type=WorkflowType.TASK,
    )
    body = _post_search(client, raw, {})
    assert body["meta"]["totalResults"] == 3
    types = {row["objectType"] for row in body["items"]}
    assert types == {"project", "course", "task"}
    proj_row = next(r for r in body["items"] if r["objectType"] == "project")
    assert proj_row["uuid"] == str(project.uuid)
    assert proj_row["projectUuid"] == str(project.uuid)
    wf_uuids = {r["graphUuid"] for r in body["items"] if r["objectType"] != "project"}
    assert wf_uuids == {str(wf_course.uuid), str(wf_task.uuid)}


@pytest.mark.django_db
def test_team_member_sees_project_and_child_workflow_backed_items(
    client: Client, user, teammate
):
    """User is on the project team (not owner) and should see the same library rows."""
    raw_member = _issue_token_for(teammate)
    project = Project.objects.create(owner=user, title="Shared", description="")
    team = Team.objects.get(project=project)
    TeamUser.objects.create(team=team, user=teammate, role=Role.VIEWER)
    wf = _graph_with_workflow(
        user,
        project=project,
        workflow_title="Workflow X",
        workflow_description="desc",
        workflow_type=WorkflowType.PROGRAM,
    )
    body = _post_search(client, raw_member, {})
    assert body["meta"]["totalResults"] == 2
    assert {r["objectType"] for r in body["items"]} == {"project", "program"}
    p_row = next(r for r in body["items"] if r["objectType"] == "project")
    assert p_row["uuid"] == str(project.uuid)
    u_row = next(r for r in body["items"] if r["objectType"] == "program")
    assert u_row["graphUuid"] == str(wf.uuid)
    assert u_row["title"] == "Workflow X"
    assert u_row["description"] == "desc"


@pytest.mark.django_db
def test_graph_without_project_not_listed_even_for_owner(client: Client, user):
    """Library only surfaces graphs tied to an accessible project."""
    raw = _issue_token_for(user)
    _graph_with_workflow(
        user,
        project=None,
        workflow_title="Orphan Workflow",
        workflow_type=WorkflowType.COURSE,
    )
    body = _post_search(client, raw, {})
    assert body["meta"]["totalResults"] == 0


# --- filters: workspaceType -------------------------------------------------


@pytest.mark.django_db
def test_workspace_type_project_returns_only_projects(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P", description="")
    _graph_with_workflow(
        user,
        project=project,
        workflow_title="U",
        workflow_type=WorkflowType.ACTIVITY,
    )
    body = _post_search(
        client,
        raw,
        {"filters": [{"name": "workspaceType", "value": "project"}]},
    )
    assert body["meta"]["totalResults"] == 1
    assert body["items"][0]["objectType"] == "project"


@pytest.mark.parametrize(
    "workflow_type,workspace_value",
    [
        (WorkflowType.ACTIVITY, "activity"),
        (WorkflowType.COURSE, "course"),
        (WorkflowType.PROGRAM, "program"),
        (WorkflowType.TASK, "task"),
    ],
)
@pytest.mark.django_db
def test_workspace_type_workflow_filters_to_that_type_only(
    client: Client, user, workflow_type, workspace_value
):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P", description="")
    target = _graph_with_workflow(
        user,
        project=project,
        workflow_title="want",
        workflow_type=workflow_type,
    )
    _graph_with_workflow(
        user,
        project=project,
        workflow_title="noise",
        workflow_type=WorkflowType.TASK if workflow_type != WorkflowType.TASK else WorkflowType.COURSE,
    )
    body = _post_search(
        client,
        raw,
        {"filters": [{"name": "workspaceType", "value": workspace_value}]},
    )
    assert body["meta"]["totalResults"] == 1
    assert body["items"][0]["graphUuid"] == str(target.uuid)
    assert body["items"][0]["objectType"] == workspace_value


# --- filters: project, discipline, isTemplate, keyword ---------------------


@pytest.mark.django_db
def test_project_filter_limits_projects_and_graphs(client: Client, user):
    raw = _issue_token_for(user)
    p_keep = Project.objects.create(owner=user, title="Keep", description="")
    p_drop = Project.objects.create(owner=user, title="Drop", description="")
    wf_keep = _graph_with_workflow(
        user, project=p_keep, workflow_title="u", workflow_type=WorkflowType.TASK
    )
    _graph_with_workflow(
        user, project=p_drop, workflow_title="v", workflow_type=WorkflowType.TASK
    )
    body = _post_search(
        client,
        raw,
        {"filters": [{"name": "project", "value": str(p_keep.uuid)}]},
    )
    assert body["meta"]["totalResults"] == 2
    uuids = {body["items"][i]["uuid"] for i in range(2) if body["items"][i]["objectType"] == "project"}
    wf_ids = {body["items"][i]["graphUuid"] for i in range(2) if body["items"][i]["objectType"] != "project"}
    assert str(p_keep.uuid) in uuids
    assert wf_ids == {str(wf_keep.uuid)}


@pytest.mark.django_db
def test_discipline_filter_applies_via_parent_project(client: Client, user):
    raw = _issue_token_for(user)
    d_match = Discipline.objects.create(label="Match")
    d_other = Discipline.objects.create(label="Other")

    p_ok = Project.objects.create(owner=user, title="Ok", description="")
    ProjectDiscipline.objects.create(project=p_ok, discipline=d_match)
    wf_ok = _graph_with_workflow(
        user, project=p_ok, workflow_title="u", workflow_type=WorkflowType.COURSE
    )

    p_bad = Project.objects.create(owner=user, title="Bad", description="")
    ProjectDiscipline.objects.create(project=p_bad, discipline=d_other)
    _graph_with_workflow(
        user, project=p_bad, workflow_title="u2", workflow_type=WorkflowType.COURSE
    )

    body = _post_search(
        client,
        raw,
        {"filters": [{"name": "discipline", "value": [d_match.id]}]},
    )
    assert body["meta"]["totalResults"] == 2
    assert {r["projectUuid"] for r in body["items"]} == {str(p_ok.uuid)}
    assert any(r["graphUuid"] == str(wf_ok.uuid) for r in body["items"])


@pytest.mark.django_db
def test_isTemplate_filter_projects_and_workflow_rows(client: Client, user):
    raw = _issue_token_for(user)
    p_t = Project.objects.create(owner=user, title="T", description="", is_template=True)
    p_f = Project.objects.create(owner=user, title="F", description="", is_template=False)
    _graph_with_workflow(
        user, project=p_t, workflow_title="u1", workflow_type=WorkflowType.TASK
    )
    _graph_with_workflow(
        user, project=p_f, workflow_title="u2", workflow_type=WorkflowType.TASK
    )
    body = _post_search(
        client,
        raw,
        {"filters": [{"name": "isTemplate", "value": True}]},
    )
    assert body["meta"]["totalResults"] == 2
    assert all(r["isTemplate"] is True for r in body["items"])
    assert {r["uuid"] for r in body["items"] if r["objectType"] == "project"} == {str(p_t.uuid)}


@pytest.mark.django_db
def test_keyword_matches_project_title(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="X Alpine Y", description="other")
    _graph_with_workflow(
        user,
        project=project,
        workflow_title="No match here",
        workflow_description="",
        workflow_type=WorkflowType.COURSE,
    )
    body = _post_search(client, raw, {"filters": [{"name": "keyword", "value": "Alpine"}]})
    assert body["meta"]["totalResults"] == 1
    assert body["items"][0]["objectType"] == "project"
    assert "Alpine" in body["items"][0]["title"]


@pytest.mark.django_db
def test_keyword_matches_project_description(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="T", description="ridge line facts")
    _graph_with_workflow(
        user,
        project=project,
        workflow_title="U",
        workflow_description="",
        workflow_type=WorkflowType.COURSE,
    )
    body = _post_search(client, raw, {"filters": [{"name": "keyword", "value": "ridge"}]})
    assert body["meta"]["totalResults"] == 1
    assert body["items"][0]["objectType"] == "project"
    assert "ridge" in body["items"][0]["description"].lower()


@pytest.mark.django_db
def test_keyword_matches_workflow_title(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="Unrelated", description="")
    wf = _graph_with_workflow(
        user,
        project=project,
        workflow_title="Moss survey",
        workflow_description="",
        workflow_type=WorkflowType.COURSE,
    )
    body = _post_search(client, raw, {"filters": [{"name": "keyword", "value": "Moss"}]})
    assert body["meta"]["totalResults"] == 1
    assert body["items"][0]["objectType"] == "course"
    assert body["items"][0]["graphUuid"] == str(wf.uuid)
    assert "Moss" in body["items"][0]["title"]


@pytest.mark.django_db
def test_keyword_matches_workflow_description(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="Unrelated", description="")
    wf = _graph_with_workflow(
        user,
        project=project,
        workflow_title="U",
        workflow_description="peat soil notes",
        workflow_type=WorkflowType.COURSE,
    )
    body = _post_search(client, raw, {"filters": [{"name": "keyword", "value": "peat"}]})
    assert body["meta"]["totalResults"] == 1
    assert body["items"][0]["graphUuid"] == str(wf.uuid)
    assert "peat" in body["items"][0]["description"].lower()


@pytest.mark.django_db
def test_keyword_matches_graph_title(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="Unrelated", description="")
    wf = _graph_with_workflow(
        user,
        project=project,
        workflow_title="Generic",
        workflow_description="GraphLabel special",
        workflow_type=WorkflowType.COURSE,
    )
    body = _post_search(client, raw, {"filters": [{"name": "keyword", "value": "GraphLabel"}]})
    assert body["meta"]["totalResults"] == 1
    assert body["items"][0]["graphUuid"] == str(wf.uuid)


# --- favorites --------------------------------------------------------------


@pytest.mark.django_db
def test_favourited_true_returns_only_favorited_rows(client: Client, user):
    raw = _issue_token_for(user)
    p1 = Project.objects.create(owner=user, title="Fav", description="")
    Project.objects.create(owner=user, title="Not", description="")
    FavoriteProject.objects.create(user=user, project=p1)
    body = _post_search(
        client,
        raw,
        {
            "filters": [
                {"name": "workspaceType", "value": "project"},
                {"name": "favourited", "value": True},
            ]
        },
    )
    assert body["meta"]["totalResults"] == 1
    assert body["items"][0]["uuid"] == str(p1.uuid)


@pytest.mark.django_db
def test_project_favorite_and_graph_favorite_are_independent_relations(
    client: Client, user
):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P", description="")
    wf = _graph_with_workflow(
        user,
        project=project,
        workflow_title="U",
        workflow_type=WorkflowType.ACTIVITY,
    )
    FavoriteProject.objects.create(user=user, project=project)

    body = _post_search(client, raw, {})
    p_row = next(r for r in body["items"] if r["objectType"] == "project")
    u_row = next(r for r in body["items"] if r["objectType"] == "activity")
    assert p_row["isFavorite"] is True
    assert u_row["isFavorite"] is False

    FavoriteProject.objects.filter(user=user, project=project).delete()
    FavoriteGraph.objects.create(user=user, graph=wf)

    body2 = _post_search(client, raw, {})
    p_row2 = next(r for r in body2["items"] if r["objectType"] == "project")
    u_row2 = next(r for r in body2["items"] if r["objectType"] == "activity")
    assert p_row2["isFavorite"] is False
    assert u_row2["isFavorite"] is True


# --- pagination meta --------------------------------------------------------


@pytest.mark.django_db
def test_pagination_metadata_total_page_count_and_slice(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P", description="")
    for i in range(4):
        _graph_with_workflow(
            user,
            project=project,
            workflow_title=f"U{i}",
            workflow_type=WorkflowType.TASK,
        )
    # 1 project + 4 tasks = 5 rows
    body = _post_search(
        client,
        raw,
        {"pagination": {"page": 0, "resultsPerPage": 2}},
    )
    assert body["meta"]["totalResults"] == 5
    assert body["meta"]["pageCount"] == 3
    assert body["meta"]["currentPage"] == 0
    assert body["meta"]["resultsPerPage"] == 2
    assert len(body["items"]) == 2

    last = _post_search(
        client,
        raw,
        {"pagination": {"page": 2, "resultsPerPage": 2}},
    )
    assert last["meta"]["currentPage"] == 2
    assert len(last["items"]) == 1


# --- sorting ----------------------------------------------------------------


@pytest.mark.django_db
def test_sort_a_z_direction(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P", description="")
    _graph_with_workflow(
        user, project=project, workflow_title="Zebra", workflow_type=WorkflowType.COURSE
    )
    _graph_with_workflow(
        user, project=project, workflow_title="Alpha", workflow_type=WorkflowType.COURSE
    )
    asc = _post_search(
        client,
        raw,
        {
            "filters": [{"name": "workspaceType", "value": "course"}],
            "sort": {"value": "A_Z", "direction": "ASC"},
        },
    )
    titles_asc = [r["title"] for r in asc["items"]]
    assert titles_asc == ["Alpha", "Zebra"]

    desc = _post_search(
        client,
        raw,
        {
            "filters": [{"name": "workspaceType", "value": "course"}],
            "sort": {"value": "A_Z", "direction": "DESC"},
        },
    )
    titles_desc = [r["title"] for r in desc["items"]]
    assert titles_desc == ["Zebra", "Alpha"]


@pytest.mark.django_db
def test_sort_date_created_orders_projects(client: Client, user):
    raw = _issue_token_for(user)
    t_old = timezone.make_aware(datetime(2020, 1, 1, 12, 0, 0))
    t_new = timezone.make_aware(datetime(2022, 6, 15, 12, 0, 0))
    p_old = Project.objects.create(owner=user, title="Old", description="")
    p_new = Project.objects.create(owner=user, title="New", description="")
    _set_project_created(p_old, t_old)
    _set_project_created(p_new, t_new)

    desc = _post_search(
        client,
        raw,
        {
            "filters": [{"name": "workspaceType", "value": "project"}],
            "sort": {"value": "DATE_CREATED", "direction": "DESC"},
        },
    )
    assert [r["title"] for r in desc["items"]] == ["New", "Old"]

    asc = _post_search(
        client,
        raw,
        {
            "filters": [{"name": "workspaceType", "value": "project"}],
            "sort": {"value": "DATE_CREATED", "direction": "ASC"},
        },
    )
    assert [r["title"] for r in asc["items"]] == ["Old", "New"]


# --- regression / envelope --------------------------------------------------


@pytest.mark.django_db
def test_library_search_returns_accessible_project_and_workflow_backed_items(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(
        owner=user,
        title="Biology Project",
        description="Project description",
        is_template=True,
    )
    graph = _graph_with_workflow(
        user,
        project=project,
        workflow_title="Biology Workflow",
        workflow_description="Workflow description",
        workflow_type=WorkflowType.ACTIVITY,
    )
    FavoriteProject.objects.create(user=user, project=project)
    FavoriteGraph.objects.create(user=user, graph=graph)

    body = _post_search(client, raw, {})
    assert set(body.keys()) == {"items", "meta"}
    assert body["meta"]["totalResults"] == 2

    project_row = next(row for row in body["items"] if row["objectType"] == "project")
    assert project_row["uuid"] == str(project.uuid)
    assert project_row["title"] == "Biology Project"
    assert project_row["description"] == "Project description"
    assert project_row["isTemplate"] is True
    assert project_row["isFavorite"] is True

    workflow_row = next(row for row in body["items"] if row["objectType"] == "activity")
    assert workflow_row["graphUuid"] == str(graph.uuid)
    assert workflow_row["projectUuid"] == str(project.uuid)
    assert workflow_row["workflowUuid"] == str(graph.workflow.uuid)
    assert workflow_row["title"] == "Biology Workflow"
    assert workflow_row["description"] == "Workflow description"
    assert workflow_row["isTemplate"] is True
    assert workflow_row["isFavorite"] is True


@pytest.mark.django_db
def test_library_search_applies_filters_including_favourited(client: Client, user, teammate):
    raw = _issue_token_for(user)
    discipline_a = Discipline.objects.create(label="A")
    discipline_b = Discipline.objects.create(label="B")

    owned_project = Project.objects.create(
        owner=user,
        title="Owned",
        description="",
        is_template=False,
    )
    ProjectDiscipline.objects.create(project=owned_project, discipline=discipline_a)
    wf_owned = _graph_with_workflow(
        user,
        project=owned_project,
        workflow_title="Chemistry Task",
        workflow_description="Lab",
        workflow_type=WorkflowType.TASK,
    )
    FavoriteGraph.objects.create(user=user, graph=wf_owned)

    team_project = Project.objects.create(
        owner=teammate,
        title="Team Project",
        description="",
        is_template=False,
    )
    team, _ = Team.objects.get_or_create(project=team_project)
    TeamUser.objects.create(team=team, user=user, role=Role.VIEWER)
    ProjectDiscipline.objects.create(project=team_project, discipline=discipline_b)
    _graph_with_workflow(
        teammate,
        project=team_project,
        workflow_title="Physics Task",
        workflow_description="",
        workflow_type=WorkflowType.TASK,
    )

    body = _post_search(
        client,
        raw,
        {
            "filters": [
                {"name": "workspaceType", "value": "task"},
                {"name": "project", "value": str(owned_project.uuid)},
                {"name": "discipline", "value": [discipline_a.id]},
                {"name": "keyword", "value": "chem"},
                {"name": "favourited", "value": True},
            ]
        },
    )
    assert body["meta"]["totalResults"] == 1
    assert len(body["items"]) == 1
    row = body["items"][0]
    assert row["objectType"] == "task"
    assert row["graphUuid"] == str(wf_owned.uuid)
    assert row["title"] == "Chemistry Task"
    assert row["isFavorite"] is True


@pytest.mark.django_db
def test_library_search_supports_sorting_and_pagination(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P")
    _graph_with_workflow(
        user,
        project=project,
        workflow_title="Zulu",
        workflow_description="",
        workflow_type=WorkflowType.COURSE,
    )
    _graph_with_workflow(
        user,
        project=project,
        workflow_title="Alpha",
        workflow_description="",
        workflow_type=WorkflowType.COURSE,
    )

    body = _post_search(
        client,
        raw,
        {
            "filters": [{"name": "workspaceType", "value": "course"}],
            "sort": {"value": "A_Z", "direction": "ASC"},
            "pagination": {"page": 0, "resultsPerPage": 1},
        },
    )
    assert body["meta"]["totalResults"] == 2
    assert body["meta"]["pageCount"] == 2
    assert body["meta"]["currentPage"] == 0
    assert body["meta"]["resultsPerPage"] == 1
    assert len(body["items"]) == 1
    assert body["items"][0]["title"] == "Alpha"


@pytest.mark.django_db
def test_project_filter_rejects_invalid_uuid_returns_empty(client: Client, user):
    raw = _issue_token_for(user)
    Project.objects.create(owner=user, title="Only", description="")
    body = _post_search(
        client,
        raw,
        {"filters": [{"name": "project", "value": str(uuid4())}]},
    )
    assert body["meta"]["totalResults"] == 0
    assert body["items"] == []
