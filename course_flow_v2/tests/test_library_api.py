from __future__ import annotations

from datetime import datetime, timedelta
from uuid import uuid4

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow_v2.core.auth import generate_raw_token, hash_token
from course_flow_v2.core.models import (
    AuthToken,
    Discipline,
    Project,
    ProjectTeam,
    Unit,
    Workflow,
)
from course_flow_v2.core.models.rel import (
    FavoriteProject,
    FavoriteWorkflow,
    ProjectDiscipline,
    ProjectTeamMember,
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
    AuthToken.objects.create(
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


def _workflow_with_unit(
    owner,
    *,
    project: Project | None,
    workflow_title: str,
    unit_title: str,
    unit_description: str = "",
    unit_type: str = Unit.UnitType.COURSE,
) -> Workflow:
    wf = Workflow.objects.create(owner=owner, project=project, title=workflow_title)
    Unit.objects.create(
        workflow=wf,
        title=unit_title,
        description=unit_description,
        unit_type=unit_type,
    )
    return wf


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
    _workflow_with_unit(
        user,
        project=project,
        workflow_title="wf",
        unit_title="Hidden Unit",
        unit_description="",
        unit_type=Unit.UnitType.TASK,
    )
    raw_stranger = _issue_token_for(stranger)
    body = _post_search(client, raw_stranger, {})
    assert body["meta"]["total_results"] == 0
    assert body["items"] == []


@pytest.mark.django_db
def test_owner_sees_own_project_and_child_unit_backed_items(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="My Project", description="d")
    wf_course = _workflow_with_unit(
        user,
        project=project,
        workflow_title="wf1",
        unit_title="Course A",
        unit_description="",
        unit_type=Unit.UnitType.COURSE,
    )
    wf_task = _workflow_with_unit(
        user,
        project=project,
        workflow_title="wf2",
        unit_title="Task B",
        unit_description="",
        unit_type=Unit.UnitType.TASK,
    )
    body = _post_search(client, raw, {})
    assert body["meta"]["total_results"] == 3
    types = {row["object_type"] for row in body["items"]}
    assert types == {"project", "course", "task"}
    proj_row = next(r for r in body["items"] if r["object_type"] == "project")
    assert proj_row["uuid"] == str(project.uuid)
    assert proj_row["project_uuid"] == str(project.uuid)
    wf_uuids = {r["workflow_uuid"] for r in body["items"] if r["object_type"] != "project"}
    assert wf_uuids == {str(wf_course.uuid), str(wf_task.uuid)}


@pytest.mark.django_db
def test_team_member_sees_project_and_child_unit_backed_items(
    client: Client, user, teammate
):
    """User is on the project team (not owner) and should see the same library rows."""
    raw_member = _issue_token_for(teammate)
    project = Project.objects.create(owner=user, title="Shared", description="")
    team = ProjectTeam.objects.get(project=project)
    ProjectTeamMember.objects.create(projectteam=team, user=teammate)
    wf = _workflow_with_unit(
        user,
        project=project,
        workflow_title="member-wf",
        unit_title="Unit X",
        unit_description="desc",
        unit_type=Unit.UnitType.PROGRAM,
    )
    body = _post_search(client, raw_member, {})
    assert body["meta"]["total_results"] == 2
    assert {r["object_type"] for r in body["items"]} == {"project", "program"}
    p_row = next(r for r in body["items"] if r["object_type"] == "project")
    assert p_row["uuid"] == str(project.uuid)
    u_row = next(r for r in body["items"] if r["object_type"] == "program")
    assert u_row["workflow_uuid"] == str(wf.uuid)
    assert u_row["title"] == "Unit X"
    assert u_row["description"] == "desc"


@pytest.mark.django_db
def test_workflow_without_project_not_listed_even_for_owner(client: Client, user):
    """Library only surfaces workflows tied to an accessible project."""
    raw = _issue_token_for(user)
    _workflow_with_unit(
        user,
        project=None,
        workflow_title="orphan",
        unit_title="Orphan Unit",
        unit_type=Unit.UnitType.COURSE,
    )
    body = _post_search(client, raw, {})
    assert body["meta"]["total_results"] == 0


# --- filters: workspaceType -------------------------------------------------


@pytest.mark.django_db
def test_workspace_type_project_returns_only_projects(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P", description="")
    _workflow_with_unit(
        user,
        project=project,
        workflow_title="w",
        unit_title="U",
        unit_type=Unit.UnitType.ACTIVITY,
    )
    body = _post_search(
        client,
        raw,
        {"filters": [{"name": "workspaceType", "value": "project"}]},
    )
    assert body["meta"]["total_results"] == 1
    assert body["items"][0]["object_type"] == "project"


@pytest.mark.parametrize(
    "unit_type,workspace_value",
    [
        (Unit.UnitType.ACTIVITY, "activity"),
        (Unit.UnitType.COURSE, "course"),
        (Unit.UnitType.PROGRAM, "program"),
        (Unit.UnitType.TASK, "task"),
    ],
)
@pytest.mark.django_db
def test_workspace_type_unit_filters_to_that_type_only(
    client: Client, user, unit_type, workspace_value
):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P", description="")
    target = _workflow_with_unit(
        user,
        project=project,
        workflow_title="t",
        unit_title="want",
        unit_type=unit_type,
    )
    _workflow_with_unit(
        user,
        project=project,
        workflow_title="other",
        unit_title="noise",
        unit_type=Unit.UnitType.TASK if unit_type != Unit.UnitType.TASK else Unit.UnitType.COURSE,
    )
    body = _post_search(
        client,
        raw,
        {"filters": [{"name": "workspaceType", "value": workspace_value}]},
    )
    assert body["meta"]["total_results"] == 1
    assert body["items"][0]["workflow_uuid"] == str(target.uuid)
    assert body["items"][0]["object_type"] == workspace_value


# --- filters: project, discipline, isTemplate, keyword ---------------------


@pytest.mark.django_db
def test_project_filter_limits_projects_and_workflows(client: Client, user):
    raw = _issue_token_for(user)
    p_keep = Project.objects.create(owner=user, title="Keep", description="")
    p_drop = Project.objects.create(owner=user, title="Drop", description="")
    wf_keep = _workflow_with_unit(
        user, project=p_keep, workflow_title="wk", unit_title="u", unit_type=Unit.UnitType.TASK
    )
    _workflow_with_unit(
        user, project=p_drop, workflow_title="wj", unit_title="v", unit_type=Unit.UnitType.TASK
    )
    body = _post_search(
        client,
        raw,
        {"filters": [{"name": "project", "value": str(p_keep.uuid)}]},
    )
    assert body["meta"]["total_results"] == 2
    uuids = {body["items"][i]["uuid"] for i in range(2) if body["items"][i]["object_type"] == "project"}
    wf_ids = {body["items"][i]["workflow_uuid"] for i in range(2) if body["items"][i]["object_type"] != "project"}
    assert str(p_keep.uuid) in uuids
    assert wf_ids == {str(wf_keep.uuid)}


@pytest.mark.django_db
def test_discipline_filter_applies_via_parent_project(client: Client, user):
    raw = _issue_token_for(user)
    d_match = Discipline.objects.create(label="Match")
    d_other = Discipline.objects.create(label="Other")

    p_ok = Project.objects.create(owner=user, title="Ok", description="")
    ProjectDiscipline.objects.create(project=p_ok, discipline=d_match)
    wf_ok = _workflow_with_unit(
        user, project=p_ok, workflow_title="w", unit_title="u", unit_type=Unit.UnitType.COURSE
    )

    p_bad = Project.objects.create(owner=user, title="Bad", description="")
    ProjectDiscipline.objects.create(project=p_bad, discipline=d_other)
    _workflow_with_unit(
        user, project=p_bad, workflow_title="w2", unit_title="u2", unit_type=Unit.UnitType.COURSE
    )

    body = _post_search(
        client,
        raw,
        {"filters": [{"name": "discipline", "value": [d_match.id]}]},
    )
    assert body["meta"]["total_results"] == 2
    assert {r["project_uuid"] for r in body["items"]} == {str(p_ok.uuid)}
    assert any(r["workflow_uuid"] == str(wf_ok.uuid) for r in body["items"])


@pytest.mark.django_db
def test_is_template_filter_projects_and_unit_rows(client: Client, user):
    raw = _issue_token_for(user)
    p_t = Project.objects.create(owner=user, title="T", description="", is_template=True)
    p_f = Project.objects.create(owner=user, title="F", description="", is_template=False)
    _workflow_with_unit(
        user, project=p_t, workflow_title="w1", unit_title="u1", unit_type=Unit.UnitType.TASK
    )
    _workflow_with_unit(
        user, project=p_f, workflow_title="w2", unit_title="u2", unit_type=Unit.UnitType.TASK
    )
    body = _post_search(
        client,
        raw,
        {"filters": [{"name": "isTemplate", "value": True}]},
    )
    assert body["meta"]["total_results"] == 2
    assert all(r["is_template"] is True for r in body["items"])
    assert {r["uuid"] for r in body["items"] if r["object_type"] == "project"} == {str(p_t.uuid)}


@pytest.mark.django_db
def test_keyword_matches_project_title(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="X Alpine Y", description="other")
    _workflow_with_unit(
        user,
        project=project,
        workflow_title="WF",
        unit_title="No match here",
        unit_description="",
        unit_type=Unit.UnitType.COURSE,
    )
    body = _post_search(client, raw, {"filters": [{"name": "keyword", "value": "Alpine"}]})
    assert body["meta"]["total_results"] == 1
    assert body["items"][0]["object_type"] == "project"
    assert "Alpine" in body["items"][0]["title"]


@pytest.mark.django_db
def test_keyword_matches_project_description(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="T", description="ridge line facts")
    _workflow_with_unit(
        user,
        project=project,
        workflow_title="WF",
        unit_title="U",
        unit_description="",
        unit_type=Unit.UnitType.COURSE,
    )
    body = _post_search(client, raw, {"filters": [{"name": "keyword", "value": "ridge"}]})
    assert body["meta"]["total_results"] == 1
    assert body["items"][0]["object_type"] == "project"
    assert "ridge" in body["items"][0]["description"].lower()


@pytest.mark.django_db
def test_keyword_matches_unit_title(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="Unrelated", description="")
    wf = _workflow_with_unit(
        user,
        project=project,
        workflow_title="WF",
        unit_title="Moss survey",
        unit_description="",
        unit_type=Unit.UnitType.COURSE,
    )
    body = _post_search(client, raw, {"filters": [{"name": "keyword", "value": "Moss"}]})
    assert body["meta"]["total_results"] == 1
    assert body["items"][0]["object_type"] == "course"
    assert body["items"][0]["workflow_uuid"] == str(wf.uuid)
    assert "Moss" in body["items"][0]["title"]


@pytest.mark.django_db
def test_keyword_matches_unit_description(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="Unrelated", description="")
    wf = _workflow_with_unit(
        user,
        project=project,
        workflow_title="WF",
        unit_title="U",
        unit_description="peat soil notes",
        unit_type=Unit.UnitType.COURSE,
    )
    body = _post_search(client, raw, {"filters": [{"name": "keyword", "value": "peat"}]})
    assert body["meta"]["total_results"] == 1
    assert body["items"][0]["workflow_uuid"] == str(wf.uuid)
    assert "peat" in body["items"][0]["description"].lower()


@pytest.mark.django_db
def test_keyword_matches_workflow_title(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="Unrelated", description="")
    wf = _workflow_with_unit(
        user,
        project=project,
        workflow_title="GraphLabel special",
        unit_title="Generic",
        unit_description="",
        unit_type=Unit.UnitType.COURSE,
    )
    body = _post_search(client, raw, {"filters": [{"name": "keyword", "value": "GraphLabel"}]})
    assert body["meta"]["total_results"] == 1
    assert body["items"][0]["workflow_uuid"] == str(wf.uuid)


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
    assert body["meta"]["total_results"] == 1
    assert body["items"][0]["uuid"] == str(p1.uuid)


@pytest.mark.django_db
def test_project_favorite_and_workflow_favorite_are_independent_relations(
    client: Client, user
):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P", description="")
    wf = _workflow_with_unit(
        user,
        project=project,
        workflow_title="W",
        unit_title="U",
        unit_type=Unit.UnitType.ACTIVITY,
    )
    FavoriteProject.objects.create(user=user, project=project)

    body = _post_search(client, raw, {})
    p_row = next(r for r in body["items"] if r["object_type"] == "project")
    u_row = next(r for r in body["items"] if r["object_type"] == "activity")
    assert p_row["is_favorite"] is True
    assert u_row["is_favorite"] is False

    FavoriteProject.objects.filter(user=user, project=project).delete()
    FavoriteWorkflow.objects.create(user=user, workflow=wf)

    body2 = _post_search(client, raw, {})
    p_row2 = next(r for r in body2["items"] if r["object_type"] == "project")
    u_row2 = next(r for r in body2["items"] if r["object_type"] == "activity")
    assert p_row2["is_favorite"] is False
    assert u_row2["is_favorite"] is True


# --- pagination meta --------------------------------------------------------


@pytest.mark.django_db
def test_pagination_metadata_total_page_count_and_slice(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P", description="")
    for i in range(4):
        _workflow_with_unit(
            user,
            project=project,
            workflow_title=f"w{i}",
            unit_title=f"U{i}",
            unit_type=Unit.UnitType.TASK,
        )
    # 1 project + 4 tasks = 5 rows
    body = _post_search(
        client,
        raw,
        {"pagination": {"page": 0, "results_per_page": 2}},
    )
    assert body["meta"]["total_results"] == 5
    assert body["meta"]["page_count"] == 3
    assert body["meta"]["current_page"] == 0
    assert body["meta"]["results_per_page"] == 2
    assert len(body["items"]) == 2

    last = _post_search(
        client,
        raw,
        {"pagination": {"page": 2, "results_per_page": 2}},
    )
    assert last["meta"]["current_page"] == 2
    assert len(last["items"]) == 1


# --- sorting ----------------------------------------------------------------


@pytest.mark.django_db
def test_sort_a_z_direction(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P", description="")
    _workflow_with_unit(
        user, project=project, workflow_title="w1", unit_title="Zebra", unit_type=Unit.UnitType.COURSE
    )
    _workflow_with_unit(
        user, project=project, workflow_title="w2", unit_title="Alpha", unit_type=Unit.UnitType.COURSE
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
def test_library_search_returns_accessible_project_and_unit_backed_items(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(
        owner=user,
        title="Biology Project",
        description="Project description",
        is_template=True,
    )
    workflow = _workflow_with_unit(
        user,
        project=project,
        workflow_title="Legacy Workflow Name",
        unit_title="Biology Unit",
        unit_description="Unit description",
        unit_type=Unit.UnitType.ACTIVITY,
    )
    FavoriteProject.objects.create(user=user, project=project)
    FavoriteWorkflow.objects.create(user=user, workflow=workflow)

    body = _post_search(client, raw, {})
    assert set(body.keys()) == {"items", "meta"}
    assert body["meta"]["total_results"] == 2

    project_row = next(row for row in body["items"] if row["object_type"] == "project")
    assert project_row["uuid"] == str(project.uuid)
    assert project_row["title"] == "Biology Project"
    assert project_row["description"] == "Project description"
    assert project_row["is_template"] is True
    assert project_row["is_favorite"] is True

    unit_row = next(row for row in body["items"] if row["object_type"] == "activity")
    assert unit_row["workflow_uuid"] == str(workflow.uuid)
    assert unit_row["project_uuid"] == str(project.uuid)
    assert unit_row["unit_uuid"] == str(workflow.unit.uuid)
    assert unit_row["title"] == "Biology Unit"
    assert unit_row["description"] == "Unit description"
    assert unit_row["is_template"] is True
    assert unit_row["is_favorite"] is True


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
    wf_owned = _workflow_with_unit(
        user,
        project=owned_project,
        workflow_title="Owned wf",
        unit_title="Chemistry Task",
        unit_description="Lab",
        unit_type=Unit.UnitType.TASK,
    )
    FavoriteWorkflow.objects.create(user=user, workflow=wf_owned)

    team_project = Project.objects.create(
        owner=teammate,
        title="Team Project",
        description="",
        is_template=False,
    )
    team, _ = ProjectTeam.objects.get_or_create(project=team_project)
    ProjectTeamMember.objects.create(projectteam=team, user=user)
    ProjectDiscipline.objects.create(project=team_project, discipline=discipline_b)
    _workflow_with_unit(
        teammate,
        project=team_project,
        workflow_title="Team wf",
        unit_title="Physics Task",
        unit_description="",
        unit_type=Unit.UnitType.TASK,
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
    assert body["meta"]["total_results"] == 1
    assert len(body["items"]) == 1
    row = body["items"][0]
    assert row["object_type"] == "task"
    assert row["workflow_uuid"] == str(wf_owned.uuid)
    assert row["title"] == "Chemistry Task"
    assert row["is_favorite"] is True


@pytest.mark.django_db
def test_library_search_supports_sorting_and_pagination(client: Client, user):
    raw = _issue_token_for(user)
    project = Project.objects.create(owner=user, title="P")
    _workflow_with_unit(
        user,
        project=project,
        workflow_title="wf-a",
        unit_title="Zulu",
        unit_description="",
        unit_type=Unit.UnitType.COURSE,
    )
    _workflow_with_unit(
        user,
        project=project,
        workflow_title="wf-b",
        unit_title="Alpha",
        unit_description="",
        unit_type=Unit.UnitType.COURSE,
    )

    body = _post_search(
        client,
        raw,
        {
            "filters": [{"name": "workspaceType", "value": "course"}],
            "sort": {"value": "A_Z", "direction": "ASC"},
            "pagination": {"page": 0, "results_per_page": 1},
        },
    )
    assert body["meta"]["total_results"] == 2
    assert body["meta"]["page_count"] == 2
    assert body["meta"]["current_page"] == 0
    assert body["meta"]["results_per_page"] == 1
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
    assert body["meta"]["total_results"] == 0
    assert body["items"] == []
