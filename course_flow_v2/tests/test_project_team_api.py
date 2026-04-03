from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow_v2.core.auth import generate_raw_token, hash_token
from course_flow_v2.core.models import (
    AuthToken,
    Project,
    ProjectTeam,
    ProjectTeamMember,
)


@pytest.fixture
def client() -> Client:
    return Client()


@pytest.fixture
def owner():
    return get_user_model().objects.create_user(
        email="team-owner@example.com", password="password123"
    )


@pytest.fixture
def member():
    return get_user_model().objects.create_user(
        email="team-member@example.com",
        password="password123",
        first_name="Pat",
        last_name="Lee",
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


def _create_project(client: Client, raw_token: str) -> str:
    response = client.post(
        "/api/project",
        data={
            "title": "Team Project",
            "description": "",
            "is_published": False,
            "is_template": False,
        },
        content_type="application/json",
        **_auth_header(raw_token),
    )
    assert response.status_code == 200, response.content
    return response.json()["uuid"]


@pytest.mark.django_db
def test_project_create_still_has_team_container(client: Client, owner):
    raw = _issue_token_for(owner)
    project_uuid = _create_project(client, raw)
    project = Project.objects.get(uuid=project_uuid)
    assert ProjectTeam.objects.filter(project=project).exists()


@pytest.mark.django_db
def test_list_project_team_returns_expected_members(client: Client, owner, member):
    raw = _issue_token_for(owner)
    project_uuid = _create_project(client, raw)
    project = Project.objects.get(uuid=project_uuid)
    team = project.team
    ProjectTeamMember.objects.create(
        projectteam=team,
        user=member,
        role=ProjectTeamMember.Role.COMMENTER,
    )

    response = client.get(
        f"/api/project/{project_uuid}/team", **_auth_header(raw)
    )
    assert response.status_code == 200, response.content
    body = response.json()
    assert body["meta"]["total"] == 1
    assert len(body["items"]) == 1
    row = body["items"][0]
    assert row["userUuid"] == str(member.uuid)
    assert row["userEmail"] == member.email
    assert row["userFirstName"] == "Pat"
    assert row["userLastName"] == "Lee"
    assert row["role"] == "commenter"
    assert row["projectTeamUuid"] == str(team.uuid)


@pytest.mark.django_db
def test_add_project_team_member_works(client: Client, owner, member):
    raw = _issue_token_for(owner)
    project_uuid = _create_project(client, raw)
    project = Project.objects.get(uuid=project_uuid)
    team = project.team

    response = client.post(
        f"/api/project/{project_uuid}/team",
        data={"userUuids": [str(member.uuid)], "role": "editor"},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert response.status_code == 200, response.content
    body = response.json()
    assert body["meta"]["total"] == 1
    assert body["items"][0]["role"] == "editor"

    persisted = ProjectTeamMember.objects.get(projectteam=team, user=member)
    assert persisted.role == ProjectTeamMember.Role.EDITOR


@pytest.mark.django_db
def test_add_duplicate_member_does_not_duplicate_row(client: Client, owner, member):
    raw = _issue_token_for(owner)
    project_uuid = _create_project(client, raw)
    project = Project.objects.get(uuid=project_uuid)
    team = project.team
    ProjectTeamMember.objects.create(
        projectteam=team,
        user=member,
        role=ProjectTeamMember.Role.VIEWER,
    )

    response = client.post(
        f"/api/project/{project_uuid}/team",
        data={"userUuids": [str(member.uuid)], "role": "editor"},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert response.status_code == 200, response.content
    assert response.json()["meta"]["total"] == 1
    assert response.json()["items"][0]["role"] == "viewer"

    assert ProjectTeamMember.objects.filter(projectteam=team, user=member).count() == 1


@pytest.mark.django_db
def test_update_project_team_member_role_works(client: Client, owner, member):
    raw = _issue_token_for(owner)
    project_uuid = _create_project(client, raw)
    project = Project.objects.get(uuid=project_uuid)
    team = project.team
    m = ProjectTeamMember.objects.create(
        projectteam=team,
        user=member,
        role=ProjectTeamMember.Role.VIEWER,
    )

    response = client.patch(
        f"/api/project/{project_uuid}/team/{m.id}",
        data={"role": "editor"},
        content_type="application/json",
        **_auth_header(raw),
    )
    assert response.status_code == 200, response.content
    assert response.json()["role"] == "editor"

    m.refresh_from_db()
    assert m.role == ProjectTeamMember.Role.EDITOR


@pytest.mark.django_db
def test_delete_project_team_member_works(client: Client, owner, member):
    raw = _issue_token_for(owner)
    project_uuid = _create_project(client, raw)
    project = Project.objects.get(uuid=project_uuid)
    team = project.team
    m = ProjectTeamMember.objects.create(
        projectteam=team,
        user=member,
        role=ProjectTeamMember.Role.VIEWER,
    )

    deleted = client.delete(
        f"/api/project/{project_uuid}/team/{m.id}", **_auth_header(raw)
    )
    assert deleted.status_code == 200
    assert deleted.json() == {"success": True}
    assert not ProjectTeamMember.objects.filter(pk=m.id).exists()


@pytest.mark.django_db
def test_delete_project_team_member_missing_returns_404(client: Client, owner):
    raw = _issue_token_for(owner)
    project_uuid = _create_project(client, raw)

    response = client.delete(
        f"/api/project/{project_uuid}/team/999999", **_auth_header(raw)
    )
    assert response.status_code == 404
