from __future__ import annotations

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

from course_flow.core.auth import generate_raw_token, hash_token
from course_flow.core.enum import AccountRole, NodeType, TeamRole, WorkflowType
from course_flow.core.models import (
    Authtoken,
    Channel,
    Graph,
    Node,
    Project,
    Section,
    Team,
    TeamUser,
    Workflow,
    WorkspaceEditLock,
)


def _user(email: str):
    return get_user_model().objects.create_user(
        email=email,
        password="password",
        account_role=AccountRole.TEACHER,
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


def _workflow(owner, workflow_type: WorkflowType) -> Workflow:
    project = Project.objects.create(owner=owner, title=f"{workflow_type} project")
    workflow = Workflow.objects.create(
        graph=Graph.objects.create(),
        author=owner,
        project=project,
        title=f"{workflow_type} workflow",
        workflow_type=workflow_type,
    )
    WorkspaceEditLock.objects.create(
        workflow=workflow,
        holder=owner,
        expires_at=timezone.now() + timedelta(hours=1),
    )
    return workflow


def _node(workflow: Workflow, node_type: NodeType, row: int) -> Node:
    section, _ = Section.objects.get_or_create(
        graph=workflow.graph, position=0, defaults={"title": ""}
    )
    channel, _ = Channel.objects.get_or_create(
        graph=workflow.graph,
        position=0,
        defaults={"title": "", "colour": "#000000"},
    )
    return Node.objects.create(
        workflow=workflow,
        section=section,
        channel=channel,
        section_row=row,
        node_type=node_type,
        title=f"Node {row}",
    )


@pytest.mark.django_db
def test_activity_overview_metadata_round_trips_through_workflow_api():
    owner = _user("activity-overview@example.com")
    workflow = _workflow(owner, WorkflowType.ACTIVITY)
    client = Client()
    headers = _auth(owner)

    initial = client.get(f"/api/workflow/{workflow.uuid}", **headers)
    assert initial.status_code == 200, initial.content
    assert initial.json()["item"]["overviewMetadata"] == {
        "code": "",
        "calculateTimeAutomatically": False,
        "timeMinutes": None,
        "calculatePonderationAutomatically": False,
        "theoryTimeMinutes": None,
        "practicalTimeMinutes": None,
        "individualTimeMinutes": None,
        "calculateCreditsAutomatically": False,
        "credits": None,
        "calculateClassificationAutomatically": False,
        "generalTimeMinutes": None,
        "specificTimeMinutes": None,
    }

    updated = client.patch(
        f"/api/workflow/{workflow.uuid}",
        data={
            "overviewMetadata": {
                "calculateTimeAutomatically": False,
                "timeMinutes": 450,
            }
        },
        content_type="application/json",
        **headers,
    )
    assert updated.status_code == 200, updated.content
    assert (
        updated.json()["item"]["overviewMetadata"]["calculateTimeAutomatically"]
        is False
    )
    assert updated.json()["item"]["overviewMetadata"]["timeMinutes"] == 450

    workflow.activitymeta.refresh_from_db()
    assert workflow.activitymeta.calculate_time is False
    assert workflow.activitymeta.time_required_minutes == 450


@pytest.mark.django_db
def test_program_overview_metadata_persists_each_program_section():
    owner = _user("program-overview@example.com")
    workflow = _workflow(owner, WorkflowType.PROGRAM)
    client = Client()
    headers = _auth(owner)

    response = client.patch(
        f"/api/workflow/{workflow.uuid}",
        data={
            "overviewMetadata": {
                "code": "PROGRAM-01",
                "calculateTimeAutomatically": False,
                "timeMinutes": 7200,
                "calculatePonderationAutomatically": False,
                "theoryTimeMinutes": 2400,
                "practicalTimeMinutes": 1800,
                "individualTimeMinutes": 3000,
                "calculateCreditsAutomatically": False,
                "credits": 12,
                "calculateClassificationAutomatically": False,
                "generalTimeMinutes": 4800,
                "specificTimeMinutes": 2400,
            }
        },
        content_type="application/json",
        **headers,
    )
    assert response.status_code == 200, response.content
    metadata = response.json()["item"]["overviewMetadata"]
    assert metadata == {
        "code": "PROGRAM-01",
        "calculateTimeAutomatically": False,
        "timeMinutes": 7200,
        "calculatePonderationAutomatically": False,
        "theoryTimeMinutes": 2400,
        "practicalTimeMinutes": 1800,
        "individualTimeMinutes": 3000,
        "calculateCreditsAutomatically": False,
        "credits": 12,
        "calculateClassificationAutomatically": False,
        "generalTimeMinutes": 4800,
        "specificTimeMinutes": 2400,
    }

    persisted = client.get(f"/api/workflow/{workflow.uuid}", **headers)
    assert persisted.status_code == 200, persisted.content
    assert persisted.json()["item"]["overviewMetadata"] == metadata


@pytest.mark.django_db
def test_overview_credits_reject_fractional_values():
    owner = _user("credits-overview@example.com")
    workflow = _workflow(owner, WorkflowType.COURSE)

    response = Client().patch(
        f"/api/workflow/{workflow.uuid}",
        data={"overviewMetadata": {"credits": 1.5}},
        content_type="application/json",
        **_auth(owner),
    )

    assert response.status_code == 422


@pytest.mark.django_db
@pytest.mark.parametrize(
    "field_name",
    [
        "theoryTimeMinutes",
        "practicalTimeMinutes",
        "individualTimeMinutes",
        "generalTimeMinutes",
        "specificTimeMinutes",
    ],
)
def test_overview_hour_only_fields_reject_minute_remainders(field_name: str):
    owner = _user(f"hour-only-{field_name.lower()}@example.com")
    workflow = _workflow(owner, WorkflowType.PROGRAM)

    response = Client().patch(
        f"/api/workflow/{workflow.uuid}",
        data={"overviewMetadata": {field_name: 90}},
        content_type="application/json",
        **_auth(owner),
    )

    assert response.status_code == 422


@pytest.mark.django_db
def test_automatic_time_is_derived_from_current_node_values():
    owner = _user("time-rollup@example.com")
    workflow = _workflow(owner, WorkflowType.ACTIVITY)
    first = _node(workflow, NodeType.TASK, 0)
    second = _node(workflow, NodeType.TASK, 1)
    first.taskmeta.time_required_minutes = 120
    first.taskmeta.save(update_fields=["time_required_minutes"])
    second.taskmeta.time_required_minutes = 210
    second.taskmeta.save(update_fields=["time_required_minutes"])
    workflow.activitymeta.calculate_time = True
    workflow.activitymeta.time_required_minutes = 5940
    workflow.activitymeta.save(
        update_fields=["calculate_time", "time_required_minutes"]
    )

    response = Client().get(f"/api/workflow/{workflow.uuid}", **_auth(owner))

    assert response.status_code == 200, response.content
    assert response.json()["item"]["overviewMetadata"]["timeMinutes"] == 330


@pytest.mark.django_db
def test_program_automatic_fields_use_local_and_linked_course_metadata():
    owner = _user("program-rollup@example.com")
    program = _workflow(owner, WorkflowType.PROGRAM)
    local_node = _node(program, NodeType.COURSE, 0)
    linked_node = _node(program, NodeType.COURSE, 1)
    linked_course = _workflow(owner, WorkflowType.COURSE)
    linked_node.linked_workflow = linked_course
    linked_node.save(update_fields=["linked_workflow"])

    local_node.coursemeta.time_required_minutes = 90
    local_node.coursemeta.credits = 3
    local_node.coursemeta.ponderation_theory_minutes = 60
    local_node.coursemeta.ponderation_practice_minutes = 120
    local_node.coursemeta.ponderation_individual_minutes = 180
    local_node.coursemeta.specific_education = True
    local_node.coursemeta.classification = "general"
    local_node.coursemeta.save()

    linked_node.coursemeta.specific_education = False
    linked_node.coursemeta.classification = "specific education"
    linked_node.coursemeta.save()

    linked_course.coursemeta.time_required_minutes = 240
    linked_course.coursemeta.credits = 5
    linked_course.coursemeta.ponderation_theory_minutes = 120
    linked_course.coursemeta.ponderation_practice_minutes = 60
    linked_course.coursemeta.ponderation_individual_minutes = 60
    linked_course.coursemeta.specific_education = True
    linked_course.coursemeta.classification = "specific education"
    linked_course.coursemeta.save()

    program.programmeta.calculate_time = "automatic"
    program.programmeta.calculate_credits = "automatic"
    program.programmeta.calculate_ponderation = "automatic"
    program.programmeta.calculate_classification = "automatic"
    program.programmeta.save()

    response = Client().get(f"/api/workflow/{program.uuid}", **_auth(owner))

    assert response.status_code == 200, response.content
    metadata = response.json()["item"]["overviewMetadata"]
    assert metadata["timeMinutes"] == 330
    assert metadata["credits"] == 8
    assert metadata["theoryTimeMinutes"] == 180
    assert metadata["practicalTimeMinutes"] == 180
    assert metadata["individualTimeMinutes"] == 240
    assert metadata["generalTimeMinutes"] == 240
    assert metadata["specificTimeMinutes"] == 90


@pytest.mark.django_db
def test_viewer_can_read_but_cannot_update_overview_metadata():
    owner = _user("overview-owner@example.com")
    viewer = _user("overview-viewer@example.com")
    workflow = _workflow(owner, WorkflowType.COURSE)
    team = Team.objects.get(project=workflow.project)
    TeamUser.objects.create(user=viewer, team=team, role=TeamRole.VIEWER)
    headers = _auth(viewer)
    client = Client()

    readable = client.get(f"/api/workflow/{workflow.uuid}", **headers)
    forbidden = client.patch(
        f"/api/workflow/{workflow.uuid}",
        data={"overviewMetadata": {"code": "NOT-ALLOWED"}},
        content_type="application/json",
        **headers,
    )

    assert readable.status_code == 200, readable.content
    assert forbidden.status_code == 403
    workflow.coursemeta.refresh_from_db()
    assert workflow.coursemeta.code == ""
