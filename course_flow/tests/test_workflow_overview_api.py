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
    return Workflow.objects.create(
        graph=Graph.objects.create(),
        author=owner,
        project=project,
        title=f"{workflow_type} workflow",
        workflow_type=workflow_type,
    )


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
        "time": None,
        "timeUnits": None,
        "calculatePonderationAutomatically": False,
        "theoryTime": None,
        "practicalTime": None,
        "individualTime": None,
        "calculateCreditsAutomatically": False,
        "credits": None,
        "calculateClassificationAutomatically": False,
        "generalTime": None,
        "specificTime": None,
    }

    updated = client.patch(
        f"/api/workflow/{workflow.uuid}",
        data={
            "overviewMetadata": {
                "calculateTimeAutomatically": False,
                "time": 7.5,
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
    assert updated.json()["item"]["overviewMetadata"]["time"] == 7.5

    workflow.activitymeta.refresh_from_db()
    assert workflow.activitymeta.calculate_time is False
    assert float(workflow.activitymeta.time_required) == 7.5


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
                "time": 120,
                "calculatePonderationAutomatically": False,
                "theoryTime": 40,
                "practicalTime": 30,
                "individualTime": 50,
                "calculateCreditsAutomatically": False,
                "credits": 12,
                "calculateClassificationAutomatically": False,
                "generalTime": 80,
                "specificTime": 40,
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
        "time": 120.0,
        "timeUnits": None,
        "calculatePonderationAutomatically": False,
        "theoryTime": 40.0,
        "practicalTime": 30.0,
        "individualTime": 50.0,
        "calculateCreditsAutomatically": False,
        "credits": 12,
        "calculateClassificationAutomatically": False,
        "generalTime": 80.0,
        "specificTime": 40.0,
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
def test_automatic_time_is_derived_from_current_node_values():
    owner = _user("time-rollup@example.com")
    workflow = _workflow(owner, WorkflowType.ACTIVITY)
    first = _node(workflow, NodeType.TASK, 0)
    second = _node(workflow, NodeType.TASK, 1)
    first.taskmeta.time_required = 2
    first.taskmeta.save(update_fields=["time_required"])
    second.taskmeta.time_required = 3.5
    second.taskmeta.save(update_fields=["time_required"])
    workflow.activitymeta.calculate_time = True
    workflow.activitymeta.time_required = 99
    workflow.activitymeta.save(update_fields=["calculate_time", "time_required"])

    response = Client().get(f"/api/workflow/{workflow.uuid}", **_auth(owner))

    assert response.status_code == 200, response.content
    assert response.json()["item"]["overviewMetadata"]["time"] == 5.5


@pytest.mark.django_db
def test_program_automatic_fields_use_local_and_linked_course_metadata():
    owner = _user("program-rollup@example.com")
    program = _workflow(owner, WorkflowType.PROGRAM)
    local_node = _node(program, NodeType.COURSE, 0)
    linked_node = _node(program, NodeType.COURSE, 1)
    linked_course = _workflow(owner, WorkflowType.COURSE)
    linked_node.linked_workflow = linked_course
    linked_node.save(update_fields=["linked_workflow"])

    local_node.coursemeta.time_required = 2
    local_node.coursemeta.credits = 3
    local_node.coursemeta.ponderation_theory = 1
    local_node.coursemeta.ponderation_practice = 0.5
    local_node.coursemeta.ponderation_individual = 0.5
    local_node.coursemeta.classification = "specific education"
    local_node.coursemeta.save()

    linked_course.coursemeta.time_required = 4
    linked_course.coursemeta.credits = 5
    linked_course.coursemeta.ponderation_theory = 2
    linked_course.coursemeta.ponderation_practice = 1
    linked_course.coursemeta.ponderation_individual = 1
    linked_course.coursemeta.classification = "general"
    linked_course.coursemeta.save()

    program.programmeta.calculate_time = "automatic"
    program.programmeta.calculate_credits = "automatic"
    program.programmeta.calculate_ponderation = "automatic"
    program.programmeta.calculate_classification = "automatic"
    program.programmeta.save()

    response = Client().get(f"/api/workflow/{program.uuid}", **_auth(owner))

    assert response.status_code == 200, response.content
    metadata = response.json()["item"]["overviewMetadata"]
    assert metadata["time"] == 6
    assert metadata["credits"] == 8
    assert metadata["theoryTime"] == 3
    assert metadata["practicalTime"] == 1.5
    assert metadata["individualTime"] == 1.5
    assert metadata["generalTime"] == 4
    assert metadata["specificTime"] == 2


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
